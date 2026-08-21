export type CrmRol = "ADMIN_CRM" | "COMERCIAL" | "SOPORTE"

export interface CrmMe {
  id: number
  username: string
  email: string
  crm_usuario_id: number
  crm_rol: CrmRol
  activo: boolean
}

export interface CrmLoginResponse {
  access: string
  refresh: string
  role: "CRM"
  crm_rol: CrmRol
  crm_usuario_id: number
}
