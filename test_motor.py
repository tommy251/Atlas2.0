import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test():
    client = AsyncIOMotorClient('mongodb://localhost:27017/Atlas2.0')
    info = await client.server_info()
    print(info)

asyncio.run(test())