export const PERMISSIONS = {
  group: {
    SEND_MESSAGE: {
      code: 'group.send-message',
      description: 'Can send messages in group',
    },
    SEND_VOICE: {
      code: 'group.send-voice',
      description: 'Can send voice messages in group',
    },
    SEND_MEDIA: {
      code: 'group.send-media',
      description: 'Can send images, videos and other files',
    },
    SEND_GIFS: {
      code: 'group.send-gifs',
      description: 'Can send GIFs',
    },
    PIN_MESSAGES: {
      code: 'group.pin-messages',
      description: 'Can pin messages',
    },
    EDIT_INFO: {
      code: 'group.edit-info',
      description: 'Can edit group name, description, photo',
    },
    INVITE_USERS: {
      code: 'group.invite-users',
      description: 'Can invite new users',
    },
    REMOVE_USERS: {
      code: 'group.remove-users',
      description: 'Can remove users',
    },
    DELETE_MESSAGES: {
      code: 'group.delete-messages',
      description: 'Can delete other users messages',
    },
  },

  channel: {
    POST_MESSAGES: {
      code: 'channel.post-messages',
      description: 'Can post messages in channel',
    },
    EDIT_POSTS: {
      code: 'channel.edit-posts',
      description: 'Can edit posts',
    },
    DELETE_POSTS: {
      code: 'channel.delete-posts',
      description: 'Can delete posts',
    },
    MANAGE_ADMINS: {
      code: 'channel.manage-admins',
      description: 'Can manage admins',
    },
  },

  global: {
    ACCESS_ADMIN_PANEL: {
      code: 'global.access-admin-panel',
      description: 'Has access to admin panel',
    },
    BAN_USERS: {
      code: 'global.ban-users',
      description: 'Can ban users globally',
    },
    UNBAN_USERS: {
      code: 'global.unban-users',
      description: 'Can unban users globally',
    },
  },
}

export function flattenPermissions(obj: any): { code: string; description: string }[] {
  return Object.values(obj).flatMap((group: any) => Object.values(group));
}
