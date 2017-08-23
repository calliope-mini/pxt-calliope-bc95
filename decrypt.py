from Crypto.Cipher import AES
import msgpack
import sys

# provide the message as the first argument
message = "CEBC9AB2394489959C13C3BC81CA450353EBA08819"
if len(sys.argv) > 1:
    message = sys.argv[1]

# if necessary provide key as second argument
key = "41eac07039b29abc41eac07039b29abc"
if len(sys.argv) > 2:
    key = sys.argv[2]

# decode from hex representation
cipher = AES.new(key.decode("hex"), AES.MODE_ECB, "")
# remove the first five bytes (key)
data = message.decode("hex")[5:]
r = b''
# decrypt AES128 ECB
for i in [0, 16]:
    r += cipher.decrypt(data[i:i+16])
# unpack first element (ignore rest, which is padding)
unpacker = msgpack.Unpacker()
unpacker.feed(r)
print unpacker.next()

