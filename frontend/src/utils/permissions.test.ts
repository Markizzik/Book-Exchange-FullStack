import { describe, expect, it } from 'vitest';

import { Permission, UserRole } from '../types';
import { getUserPermissions, hasAllPermissions, hasAnyPermission, hasPermission, isAdmin, isUser } from './permissions';

describe('permissions utils', () => {
  it('returns public permissions for guest', () => {
    const permissions = getUserPermissions(UserRole.GUEST);

    expect(permissions).toContain(Permission.BOOKS_VIEW);
    expect(permissions).not.toContain(Permission.BOOKS_CREATE);
  });

  it('recognizes admin-only permissions', () => {
    expect(hasPermission(UserRole.ADMIN, Permission.ROLES_MANAGE)).toBe(true);
    expect(hasPermission(UserRole.USER, Permission.ROLES_MANAGE)).toBe(false);
  });

  it('checks any/all permission groups', () => {
    expect(
      hasAnyPermission(UserRole.USER, [Permission.ROLES_MANAGE, Permission.BOOKS_CREATE]),
    ).toBe(true);
    expect(
      hasAllPermissions(UserRole.ADMIN, [Permission.BOOKS_EDIT_ANY, Permission.ROLES_MANAGE]),
    ).toBe(true);
    expect(
      hasAllPermissions(UserRole.USER, [Permission.BOOKS_EDIT_ANY, Permission.BOOKS_CREATE]),
    ).toBe(false);
  });

  it('derives role shortcuts', () => {
    expect(isAdmin(UserRole.ADMIN)).toBe(true);
    expect(isUser(UserRole.ADMIN)).toBe(true);
    expect(isUser(UserRole.USER)).toBe(true);
    expect(isUser(UserRole.GUEST)).toBe(false);
  });
});
