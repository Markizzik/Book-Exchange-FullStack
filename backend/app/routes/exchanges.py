from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..database import get_db
from ..models import Exchange, Book, User, UserRole
from ..schemas import ExchangeResponse, ExchangeCreate
from ..security import get_current_user
from ..dependencies import get_socket_manager
from fastapi import Request
from ..permissions import has_permission, Permission

router = APIRouter(prefix="/exchanges", tags=["exchanges"])

def get_socket_manager(request: Request):
    return request.app.state.socket_manager

@router.post("/", response_model=ExchangeResponse)
def create_exchange(
    exchange: ExchangeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager=Depends(get_socket_manager)
):

    if not has_permission(current_user, Permission.EXCHANGES_CREATE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для создания обмена"
        )
    

    book = db.query(Book).filter(Book.id == exchange.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Книга не найдена")
    
    if book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Вы не можете обменять свою же книгу")
    
    existing_exchange = db.query(Exchange).filter(
        Exchange.book_id == exchange.book_id,
        Exchange.status.in_(["pending", "accepted"])
    ).first()
    
    if existing_exchange:
        raise HTTPException(status_code=400, detail="Уже есть активное предложение обмена для этой книги")
    
    db_exchange = Exchange(
        book_id=exchange.book_id,
        requester_id=current_user.id,
        owner_id=book.owner_id,
        status="pending"
    )
    db.add(db_exchange)
    db.commit()
    db.refresh(db_exchange)
    background_tasks.add_task(socket_manager.notify_new_exchange, db_exchange.id)
    return db_exchange

@router.get("/my-requests", response_model=list[ExchangeResponse])
def get_my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchanges = db.query(Exchange).filter(Exchange.requester_id == current_user.id).all()
    return exchanges

@router.get("/my-offers", response_model=list[ExchangeResponse])
def get_my_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exchanges = db.query(Exchange).filter(Exchange.owner_id == current_user.id).all()
    return exchanges

@router.put("/{exchange_id}/accept", response_model=ExchangeResponse)
def accept_exchange(
    exchange_id: int,
    background_tasks: BackgroundTasks,  
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager = Depends(get_socket_manager)
):
    if not has_permission(current_user, Permission.EXCHANGES_ACCEPT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для принятия обмена"
        )
    
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Обмен не найден")
    
    if exchange.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для принятия этого обмена"
        )
    
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Этот обмен уже был обработан")
    
    exchange.status = "accepted"
    
    book = db.query(Book).filter(Book.id == exchange.book_id).first()
    if book:
        book.status = "exchanged"
    
    db.commit()
    db.refresh(exchange)
    background_tasks.add_task(socket_manager.notify_exchange_status_update, exchange.id, "accepted")
    return exchange

@router.put("/{exchange_id}/reject", response_model=ExchangeResponse)
def reject_exchange(
    exchange_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    socket_manager = Depends(get_socket_manager)
):
    
    if not has_permission(current_user, Permission.EXCHANGES_REJECT):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отклонения обмена"
        )
    
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Обмен не найден")
    
    if exchange.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отклонения этого обмена"
        )
    
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Этот обмен уже был обработан")
    
    exchange.status = "rejected"
    db.commit()
    db.refresh(exchange)
    background_tasks.add_task(socket_manager.notify_exchange_status_update, exchange.id, "rejected")
    return exchange

@router.delete("/{exchange_id}/cancel")
def cancel_exchange(
    exchange_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    if not has_permission(current_user, Permission.EXCHANGES_CANCEL):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отмены обмена"
        )

    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Обмен не найден")
    
    if exchange.requester_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для отмены этого обмена"
        )
    
    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Этот обмен уже был обработан")
    
    db.delete(exchange)
    db.commit()
    return {"message": "Обмен отменён успешно"}