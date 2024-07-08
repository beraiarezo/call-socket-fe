const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const localPeerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "username1",
      credential: "password1",
    },
    {
      urls: "turn:162.19.254.155:3478",
      username: "username1",
      credential: "password1",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "username1",
      credential: "password1",
    },
    {
      urls: "turn:162.19.254.155:3478?transport=udp",
      username: "username1",
      credential: "password1",
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

function sendMessage(message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error("WebSocket connection is not open.");
  }
}

socket.onopen = async () => {
  console.log("WebSocket connection established.");
  startCall(); // Start the call once WebSocket is open
};

// startCall();
