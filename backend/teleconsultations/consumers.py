import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TeleconsultationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        print(f"WS Connect: User={self.user}, IsAuthenticated={not self.user.is_anonymous}")
        if self.user.is_anonymous:
            print("WS Connect: Rejecting anonymous user")
            await self.close()
        else:
            # Group unique to the user
            self.group_name = f"user_{self.user.id}"
            print(f"WS Connect: Joining group {self.group_name}")
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()
            print(f"WS Connect: Accepted {self.group_name}")

    async def disconnect(self, close_code):
        print(f"WS Disconnect: User={self.user}, Code={close_code}")
        if not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from group
    async def status_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'status_update',
            'teleconsultation_id': event['teleconsultation_id'],
            'new_status': event['new_status'],
            'message': event['message']
        }))
