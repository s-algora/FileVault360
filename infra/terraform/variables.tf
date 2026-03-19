variable "resource_group_name" {
  description = "Base name for the resource group"
  type        = string
  default     = "rg-filevault360"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "cosmos_db_name" {
  description = "Cosmos DB account name prefix"
  type        = string
  default     = "cosmos-filevault360"
}

variable "storage_account_name" {
  description = "Storage account name prefix"
  type        = string
  default     = "stfilevault360"
}

variable "key_vault_name" {
  description = "Key Vault name prefix"
  type        = string
  default     = "kv-filevault360"
}

variable "redis_name" {
  description = "Redis cache name prefix"
  type        = string
  default     = "redis-filevault360"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project   = "FileVault360"
    ManagedBy = "Terraform"
  }
}
