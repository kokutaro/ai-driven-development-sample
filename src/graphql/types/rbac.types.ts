/**
 * RBAC用GraphQL型定義
 *
 * ロールベースアクセス制御のためのGraphQL型を定義します。
 * TypeGraphQLデコレータを使用してスキーマ定義を行います。
 */
import { ArgsType, Field, ID, InputType, ObjectType } from 'type-graphql'

/**
 * ロール型
 */
@ObjectType()
export class Role {
  @Field(() => Date)
  createdAt!: Date

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  displayName!: string

  @Field(() => ID)
  id!: string

  @Field(() => Boolean)
  isSystem!: boolean

  @Field(() => String)
  name!: string

  @Field(() => [Permission], { nullable: true })
  permissions?: Permission[]

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => [User], { nullable: true })
  users?: User[]
}

/**
 * 権限型
 */
@ObjectType()
export class Permission {
  @Field(() => String)
  action!: string

  @Field(() => Date)
  createdAt!: Date

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  displayName!: string

  @Field(() => ID)
  id!: string

  @Field(() => Boolean)
  isSystem!: boolean

  @Field(() => String)
  name!: string

  @Field(() => String)
  resource!: string

  @Field(() => [Role], { nullable: true })
  roles?: Role[]

  @Field(() => Date)
  updatedAt!: Date
}

/**
 * ユーザーロール関係型
 */
@ObjectType()
export class UserRole {
  @Field(() => Date)
  createdAt!: Date

  @Field(() => ID)
  id!: string

  @Field(() => Role)
  role!: Role

  @Field(() => ID)
  roleId!: string

  @Field(() => Date)
  updatedAt!: Date

  @Field(() => User)
  user!: User

  @Field(() => ID)
  userId!: string
}

/**
 * ユーザー型（RBAC機能拡張版）
 */
@ObjectType()
export class User {
  @Field(() => Date)
  createdAt!: Date

  @Field(() => String, { nullable: true })
  email?: string

  @Field(() => ID)
  id!: string

  @Field(() => String, { nullable: true })
  image?: string

  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => [Permission], { nullable: true })
  permissions?: Permission[]

  @Field(() => [Role], { nullable: true })
  roles?: Role[]

  @Field(() => Date)
  updatedAt!: Date
}

/**
 * ロール作成入力型
 */
@InputType()
export class CreateRoleInput {
  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  displayName!: string

  @Field(() => String)
  name!: string

  @Field(() => [String], { nullable: true })
  permissionIds?: string[]
}

/**
 * ロール更新入力型
 */
@InputType()
export class UpdateRoleInput {
  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String, { nullable: true })
  displayName?: string

  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => [String], { nullable: true })
  permissionIds?: string[]
}

/**
 * 権限作成入力型
 */
@InputType()
export class CreatePermissionInput {
  @Field(() => String)
  action!: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String)
  displayName!: string

  @Field(() => String)
  name!: string

  @Field(() => String)
  resource!: string
}

/**
 * 権限更新入力型
 */
@InputType()
export class UpdatePermissionInput {
  @Field(() => String, { nullable: true })
  action?: string

  @Field(() => String, { nullable: true })
  description?: string

  @Field(() => String, { nullable: true })
  displayName?: string

  @Field(() => String, { nullable: true })
  name?: string

  @Field(() => String, { nullable: true })
  resource?: string
}

/**
 * ユーザーロール割り当て入力型
 */
@InputType()
export class AssignUserRoleInput {
  @Field(() => ID)
  roleId!: string

  @Field(() => ID)
  userId!: string
}

/**
 * ユーザーロール削除入力型
 */
@InputType()
export class RemoveUserRoleInput {
  @Field(() => ID)
  roleId!: string

  @Field(() => ID)
  userId!: string
}

/**
 * 権限チェック引数型
 */
@ArgsType()
export class CheckPermissionArgs {
  @Field(() => String, { nullable: true })
  action?: string

  @Field(() => String)
  permission!: string

  @Field(() => String, { nullable: true })
  resource?: string

  @Field(() => ID)
  userId!: string
}

/**
 * ロールチェック引数型
 */
@ArgsType()
export class CheckRoleArgs {
  @Field(() => String)
  roleName!: string

  @Field(() => ID)
  userId!: string
}

/**
 * ユーザー権限レスポンス型
 */
@ObjectType()
export class UserPermissionsResponse {
  @Field(() => [String])
  permissionNames!: string[]

  @Field(() => [Permission])
  permissions!: Permission[]

  @Field(() => [String])
  roleNames!: string[]

  @Field(() => [Role])
  roles!: Role[]

  @Field(() => User)
  user!: User
}

/**
 * 権限チェック結果型
 */
@ObjectType()
export class PermissionCheckResult {
  @Field(() => String, { nullable: true })
  action?: string

  @Field(() => Boolean)
  hasPermission!: boolean

  @Field(() => String)
  permission!: string

  @Field(() => String, { nullable: true })
  reason?: string

  @Field(() => String, { nullable: true })
  resource?: string
}

/**
 * ロールチェック結果型
 */
@ObjectType()
export class RoleCheckResult {
  @Field(() => Boolean)
  hasRole!: boolean

  @Field(() => String, { nullable: true })
  reason?: string

  @Field(() => String)
  roleName!: string
}
