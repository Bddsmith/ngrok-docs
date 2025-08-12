<!-- Code generated for API Clients. DO NOT EDIT. -->

#### Example Response

```json
{
  "endpoints": [
    {
      "bindings": [
        "public"
      ],
      "created_at": "2025-08-12T10:07:59Z",
      "description": "sample cloud endpoint",
      "domain": {
        "id": "rd_31BMzUk5W6LvRFy8KRULUELng1l",
        "uri": "https://api.ngrok.com/reserved_domains/rd_31BMzUk5W6LvRFy8KRULUELng1l"
      },
      "hostport": "endpoint-example2.com:443",
      "id": "ep_31BN08pu7YXlC40NCxH5Idb0Zdb",
      "metadata": "{\"environment\": \"staging\"}",
      "pooling_enabled": false,
      "proto": "https",
      "public_url": "https://endpoint-example2.com",
      "traffic_policy": "{\"on_http_request\":[{\"actions\":[{\"type\":\"deny\",\"config\":{\"status_code\":404}}]}]}",
      "type": "cloud",
      "updated_at": "2025-08-12T10:07:59Z",
      "uri": "https://api.ngrok.com/endpoints/ep_31BN08pu7YXlC40NCxH5Idb0Zdb",
      "url": "https://endpoint-example2.com"
    },
    {
      "bindings": [
        "public"
      ],
      "created_at": "2025-08-12T10:07:56Z",
      "hostport": "64f2fa981f10.ngrok.paid:443",
      "id": "ep_31BMziqwBQsDQl6l3TTk7nfMGMY",
      "name": "command_line",
      "pooling_enabled": false,
      "principal": {
        "id": "usr_31BMtBmB2w8LxZPBXHLXtlv2z66",
        "uri": ""
      },
      "proto": "https",
      "public_url": "https://64f2fa981f10.ngrok.paid",
      "tunnel": {
        "id": "tn_31BMziqwBQsDQl6l3TTk7nfMGMY",
        "uri": "https://api.ngrok.com/tunnels/tn_31BMziqwBQsDQl6l3TTk7nfMGMY"
      },
      "tunnel_session": {
        "id": "ts_31BMziDrGPQRv8RyH9HZ155lfgP",
        "uri": "https://api.ngrok.com/tunnel_sessions/ts_31BMziDrGPQRv8RyH9HZ155lfgP"
      },
      "type": "ephemeral",
      "updated_at": "2025-08-12T10:07:56Z",
      "upstream_url": "http://localhost:80",
      "url": "https://64f2fa981f10.ngrok.paid"
    },
    {
      "bindings": [
        "public"
      ],
      "created_at": "2025-08-12T10:07:54Z",
      "domain": {
        "id": "rd_31BMzUk5W6LvRFy8KRULUELng1l",
        "uri": "https://api.ngrok.com/reserved_domains/rd_31BMzUk5W6LvRFy8KRULUELng1l"
      },
      "edge": {
        "id": "edgtls_31BMzTYW8Z2mh1oPOPowEesAlxd",
        "uri": "https://api.ngrok.com/edges/tls/edgtls_31BMzTYW8Z2mh1oPOPowEesAlxd"
      },
      "hostport": "endpoint-example2.com:443",
      "id": "ep_31BMzSmUdjVK3m4VGYefhD3hAjM",
      "pooling_enabled": false,
      "proto": "tls",
      "public_url": "tls://endpoint-example2.com",
      "type": "edge",
      "updated_at": "2025-08-12T10:07:54Z"
    }
  ],
  "next_page_uri": null,
  "uri": "https://api.ngrok.com/endpoints"
}
```
