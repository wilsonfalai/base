import { administrator, collaborator } from '@mosaicgestao/auth/permissions';

describe('authentication permissions', () => {
  it('allows administrators to manage users', () => {
    expect(
      administrator.authorize({
        user: ['create', 'list', 'set-role', 'ban'],
      }),
    ).toMatchObject({ success: true });
  });

  it('denies user management to collaborators', () => {
    expect(collaborator.authorize({ user: ['list'] })).toMatchObject({
      success: false,
    });
  });
});
