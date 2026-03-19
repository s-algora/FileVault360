resource "azurerm_storage_account" "main" {
  name                     = "${var.storage_account_name}${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
  tags                     = var.tags
}

resource "azurerm_storage_container" "files" {
  name                  = "filevault360-files"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_queue" "processing" {
  name                 = "file-processing"
  storage_account_name = azurerm_storage_account.main.name
}

resource "azurerm_storage_share" "documents" {
  name                 = "shared-documents"
  storage_account_name = azurerm_storage_account.main.name
  quota                = 50
}
