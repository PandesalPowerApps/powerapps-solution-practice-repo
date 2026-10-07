/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * This file is auto-generated. Do not modify it manually.
 * Changes to this file may be overwritten.
 */

export const dataSourcesInfo = {
  "audits": {
    "tableId": "",
    "version": "",
    "primaryKey": "auditid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "practmp_locations": {
    "tableId": "",
    "version": "",
    "primaryKey": "practmp_locationid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "practmp_product1s": {
    "tableId": "",
    "version": "",
    "primaryKey": "practmp_product1id",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "practmp_productlocationjoins": {
    "tableId": "",
    "version": "",
    "primaryKey": "practmp_productlocationjoinid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "retrieveauditdetails": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "RetrieveAuditDetails": {
        "path": "/api/data/v9.2/audits({id})/Microsoft.Dynamics.CRM.RetrieveAuditDetails",
        "method": "GET",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "retrieveenvironmentvariablevalue": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "RetrieveEnvironmentVariableValue": {
        "path": "/api/data/v9.2/RetrieveEnvironmentVariableValue",
        "method": "GET",
        "parameters": [
          {
            "name": "DefinitionSchemaName",
            "in": "query",
            "required": true,
            "type": "string"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "retrieveuserprivileges": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "RetrieveUserPrivileges": {
        "path": "/api/data/v9.2/systemusers({id})/Microsoft.Dynamics.CRM.RetrieveUserPrivileges",
        "method": "GET",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "type": "string",
            "format": "guid"
          }
        ],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  },
  "systemusers": {
    "tableId": "",
    "version": "",
    "primaryKey": "systemuserid",
    "dataSourceType": "Dataverse",
    "apis": {}
  },
  "whoami": {
    "tableId": "",
    "version": "",
    "primaryKey": "",
    "dataSourceType": "Dataverse",
    "apis": {
      "WhoAmI": {
        "path": "/api/data/v9.2/WhoAmI",
        "method": "GET",
        "parameters": [],
        "responseInfo": {
          "200": {
            "type": "object"
          }
        }
      }
    }
  }
};
