import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

// Auto-refresh auth token
pb.autoCancellation(false);

export default pb;