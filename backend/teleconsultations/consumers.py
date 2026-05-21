import json
from channels.generic.websocket import AsyncWebsocketConsumer

class TeleconsultationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()
        else:
            # Group unique to the user
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
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
