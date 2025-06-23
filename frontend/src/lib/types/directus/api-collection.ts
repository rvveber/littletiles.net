/** * Generated TypeScript types for Directus Schema * Generated on: 2025-06-22T16:17:59.048Z */
export interface MinecraftAccount {
  id: string;
  date_created: 'datetime';
  date_updated: 'datetime';
  name: string;
  skin_url: string;
  user_created: string | DirectusUser;
  user_updated: string | DirectusUser;
  uuid: string;
}

export interface StructurePost {
  id: string;
  status: string;
  user_created: string | DirectusUser;
  date_created: 'datetime';
  user_updated: string | DirectusUser;
  date_updated: 'datetime';
}

export interface DirectusUser {
  id: string;
  minecraft_account: string | MinecraftAccount;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  location: string;
  title: string;
  description: string;
  tags: string;
  avatar: string;
  language: string;
  tfa_secret: boolean;
  status: string;
  role: string;
  token: string;
  last_access: string;
  last_page: string;
  provider: string;
  external_identifier: string;
  auth_data: string;
  email_notifications: boolean;
  appearance: string;
  theme_dark: string;
  theme_light: string;
  theme_light_overrides: string;
  theme_dark_overrides: string;
  policies: string;
}

export interface DirectusFile {
  id: string;
  storage: string;
  filename_disk: string;
  filename_download: string;
  title: string;
  type: string;
  folder: string;
  uploaded_by: string;
  uploaded_on: string;
  modified_by: string;
  modified_on: string;
  charset: string;
  filesize: number;
  width: number;
  height: number;
  duration: number;
  embed: string;
  description: string;
  location: string;
  tags: string;
  metadata: string;
  created_on: string;
  focal_point_x: string;
  focal_point_y: string;
  tus_id: string;
  tus_data: string;
}

export interface DirectusFolder {
  id: string;
  name: string;
  parent: string;
}

export interface DirectusRole {
  id: string;
  name: string;
  icon: string;
  description: string;
  admin_access: boolean;
  app_access: boolean;
  children: string;
  users: string;
  parent: string;
  policies: string;
}

export interface ApiCollections {
  minecraft_accounts: MinecraftAccount[];
  structure_posts: StructurePost[];
  directus_users: DirectusUser[];
  directus_files: DirectusFile[];
  directus_folders: DirectusFolder[];
  directus_roles: DirectusRole[];
}

