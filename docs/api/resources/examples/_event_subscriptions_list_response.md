<!-- Code generated for API Clients. DO NOT EDIT. -->

#### Example Response

```json
{
  "event_subscriptions": [
    {
      "created_at": "2025-08-12T10:08:00Z",
      "description": "ip policy creations",
      "destinations": [
        {
          "id": "ed_31BN0CJynUOEzoYs4THXVcvgtGE",
          "uri": "https://api.ngrok.com/event_destinations/ed_31BN0CJynUOEzoYs4THXVcvgtGE"
        }
      ],
      "id": "esb_31BN0GXipghXSG9To6792qp2Eh0",
      "metadata": "{\"environment\": \"staging\"}",
      "sources": [
        {
          "type": "ip_policy_created.v0",
          "uri": "https://api.ngrok.com/event_subscriptions/esb_31BN0GXipghXSG9To6792qp2Eh0/sources/ip_policy_created.v0"
        }
      ],
      "uri": "https://api.ngrok.com/event_subscriptions/esb_31BN0GXipghXSG9To6792qp2Eh0"
    }
  ],
  "next_page_uri": null,
  "uri": "https://api.ngrok.com/event_subscriptions"
}
```
