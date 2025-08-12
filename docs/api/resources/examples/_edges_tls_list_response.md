<!-- Code generated for API Clients. DO NOT EDIT. -->

#### Example Response

```json
{
  "next_page_uri": null,
  "tls_edges": [
    {
      "backend": null,
      "created_at": "2025-08-12T10:08:05Z",
      "description": "acme tls edge",
      "hostports": [
        "example.com:443"
      ],
      "id": "edgtls_31BN0rEEfVwYlL64CSNyfJp8pSo",
      "ip_restriction": null,
      "metadata": "{\"environment\": \"staging\"}",
      "mutual_tls": null,
      "policy": null,
      "tls_termination": null,
      "traffic_policy": null,
      "uri": "https://api.ngrok.com/edges/tls/edgtls_31BN0rEEfVwYlL64CSNyfJp8pSo"
    },
    {
      "backend": {
        "backend": {
          "id": "bkdhr_31BMzWCCBjkho96GVp1cQI0YXGN",
          "uri": "https://api.ngrok.com/backends/http_response/bkdhr_31BMzWCCBjkho96GVp1cQI0YXGN"
        },
        "enabled": true
      },
      "created_at": "2025-08-12T10:07:54Z",
      "description": "acme tls edge",
      "hostports": [
        "endpoint-example2.com:443"
      ],
      "id": "edgtls_31BMzTYW8Z2mh1oPOPowEesAlxd",
      "ip_restriction": null,
      "mutual_tls": null,
      "policy": null,
      "tls_termination": null,
      "traffic_policy": null,
      "uri": "https://api.ngrok.com/edges/tls/edgtls_31BMzTYW8Z2mh1oPOPowEesAlxd"
    }
  ],
  "uri": "https://api.ngrok.com/edges/tls"
}
```
