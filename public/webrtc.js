// webrtc.js

// Connect to signaling server
const signalingServer = io('http://localhost:3000');

// STUN server configuration
const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
let localStream;
let peerConnection;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

// Access camera and microphone
async function startMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
}

// Initialize peer connection
function initializePeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // ICE candidate event
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            signalingServer.emit('ice-candidate', event.candidate);
        }
    };

    // Display remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
}

// Button actions
document.getElementById('createOfferBtn').onclick = async () => {
    initializePeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingServer.emit('offer', offer);
};

document.getElementById('answerBtn').onclick = async () => {
    if (!peerConnection) initializePeerConnection();
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    signalingServer.emit('answer', answer);
};

document.getElementById('disconnectBtn').onclick = () => {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
    }
    signalingServer.emit('disconnect');
};

// Signaling server event handlers
signalingServer.on('offer', async (offer) => {
    if (!peerConnection) initializePeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    document.getElementById('answerBtn').disabled = false; // Enable answer button
});

signalingServer.on('answer', async (answer) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

signalingServer.on('ice-candidate', async (candidate) => {
    if (candidate) await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Start media when the page loads
startMedia();
