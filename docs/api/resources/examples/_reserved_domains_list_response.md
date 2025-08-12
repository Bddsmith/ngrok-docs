<!-- Code generated for API Clients. DO NOT EDIT. -->

#### Example Response

```json
{
  "next_page_uri": null,
  "reserved_domains": [
    {
      "acme_challenge_cname_target": null,
      "certificate": {
        "id": "cert_31BMxW00HWUbnaxMiDrcr2t3hNd",
        "uri": "https://api.ngrok.com/tls_certificates/cert_31BMxW00HWUbnaxMiDrcr2t3hNd"
      },
      "certificate_management_policy": null,
      "certificate_management_status": null,
      "cname_target": "2udamkamcl8pjmrff.2chaxhc2chskwcnd6.local-ngrok-cname.com",
      "created_at": "2025-08-12T10:07:38Z",
      "domain": "myapp.mydomain.com",
      "error_redirect_url": null,
      "http_endpoint_configuration": null,
      "https_endpoint_configuration": null,
      "id": "rd_31BMxRrx77tx26vGa6E6BrvdJZS",
      "is_dev": false,
      "region": "",
      "uri": "https://api.ngrok.com/reserved_domains/rd_31BMxRrx77tx26vGa6E6BrvdJZS"
    },
    {
      "acme_challenge_cname_target": null,
      "certificate": null,
      "certificate_management_policy": {
        "authority": "letsencrypt",
        "private_key_type": "ecdsa"
      },
      "certificate_management_status": {
        "provisioning_job": {
          "error_code": null,
          "msg": "Managed certificate provisioning in progress.",
          "retries_at": null,
          "started_at": "2025-08-12T10:07:38Z"
        },
        "renews_at": null
      },
      "cname_target": "4knqktdwka2umyjjc.2chaxhc2chskwcnd6.local-ngrok-cname.com",
      "created_at": "2025-08-12T10:07:38Z",
      "description": "Device 0001 Dashboard",
      "domain": "manage-0002.app.example.com",
      "error_redirect_url": null,
      "http_endpoint_configuration": null,
      "https_endpoint_configuration": null,
      "id": "rd_31BMxQic9ntt1wXWvnN2zal5OiN",
      "is_dev": false,
      "metadata": "{\"service\": \"dashboard\"}",
      "region": "",
      "uri": "https://api.ngrok.com/reserved_domains/rd_31BMxQic9ntt1wXWvnN2zal5OiN"
    },
    {
      "acme_challenge_cname_target": null,
      "certificate": null,
      "certificate_management_policy": null,
      "certificate_management_status": null,
      "cname_target": null,
      "created_at": "2025-08-12T10:07:07Z",
      "description": "Your dev domain",
      "domain": "simply-evolved-cicada.ngrok-free.dev",
      "error_redirect_url": null,
      "http_endpoint_configuration": null,
      "https_endpoint_configuration": null,
      "id": "rd_31BMtd6TErAjfnpIZpRBw0N62i6",
      "is_dev": true,
      "region": "",
      "uri": "https://api.ngrok.com/reserved_domains/rd_31BMtd6TErAjfnpIZpRBw0N62i6"
    }
  ],
  "uri": "https://api.ngrok.com/reserved_domains"
}
```
