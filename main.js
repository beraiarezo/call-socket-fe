const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const localPeerConnection = new RTCPeerConnection({
  iceServers: [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "12d6b07bdfd822e966c31252",
      credential: "34t0s95veiEbJNif",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "12d6b07bdfd822e966c31252",
      credential: "34t0s95veiEbJNif",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "12d6b07bdfd822e966c31252",
      credential: "34t0s95veiEbJNif",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "12d6b07bdfd822e966c31252",
      credential: "34t0s95veiEbJNif",
    },
  ],
});

const socket = new WebSocket("wss://reel-call-76d923366ef0.herokuapp.com/");

console.log(socket, "sockket");
socket.onmessage = async (message) => {
  const data = JSON.parse(message.data);

  if (data.offer) {
    await localPeerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );
    const answer = await localPeerConnection.createAnswer();
    await localPeerConnection.setLocalDescription(answer);
    socket.send(JSON.stringify({ answer }));
  } else if (data.answer) {
    await localPeerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
  } else if (data.candidate) {
    await localPeerConnection.addIceCandidate(
      new RTCIceCandidate(data.candidate)
    );
  }
};

localPeerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.send(JSON.stringify({ candidate: event.candidate }));
  }
};

localPeerConnection.ontrack = (event) => {
  remoteVideo.srcObject = event.streams[0];
};

async function startCall() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  localVideo.srcObject = stream;
  stream
    .getTracks()
    .forEach((track) => localPeerConnection.addTrack(track, stream));

  const offer = await localPeerConnection.createOffer();
  await localPeerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({ offer }));
}

startCall();
