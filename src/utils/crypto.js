const encoder = new TextEncoder();
const decoder = new TextDecoder();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateKey() {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(secret, password = null) {
  const key = await generateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const secretBytes = encoder.encode(secret);
  
  const encryptedContent = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    secretBytes
  );
  
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  
  let finalKey = exportedKey;
  let passwordSalt = null;
  let passwordIv = null;
  
  if (password) {
    passwordSalt = crypto.getRandomValues(new Uint8Array(16));
    passwordIv = crypto.getRandomValues(new Uint8Array(12));
    
    const passwordKey = await deriveKey(password, passwordSalt);
    
    finalKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: passwordIv },
      passwordKey,
      exportedKey
    );
  }
  
  return {
    encryptedContent: arrayBufferToBase64(encryptedContent),
    iv: arrayBufferToBase64(iv),
    key: arrayBufferToBase64(finalKey),
    passwordSalt: passwordSalt ? arrayBufferToBase64(passwordSalt) : null,
    passwordIv: passwordIv ? arrayBufferToBase64(passwordIv) : null
  };
}

export async function decryptSecret(encryptedData, password = null) {
  const salt = encryptedData.passwordSalt || encryptedData.ps;
  const iv = encryptedData.passwordIv || encryptedData.pi;
  
  const contentIv = new Uint8Array(base64ToArrayBuffer(encryptedData.i || encryptedData.iv));
  let keyBuffer = base64ToArrayBuffer(encryptedData.k || encryptedData.key);
  
  if (salt && password) {
    const passwordSalt = new Uint8Array(base64ToArrayBuffer(salt));
    const passwordIv = new Uint8Array(base64ToArrayBuffer(iv));
    
    const derivedKey = await deriveKey(password, passwordSalt);
    
    const decryptedKey = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: passwordIv },
      derivedKey,
      keyBuffer
    );
    
    keyBuffer = decryptedKey;
  }
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const encryptedContent = base64ToArrayBuffer(encryptedData.e || encryptedData.encryptedContent);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: contentIv },
    key,
    encryptedContent
  );
  
  return decoder.decode(decrypted);
}

export function generateId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

export function encodePayload(data) {
  return btoa(JSON.stringify(data));
}

export function decodePayload(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

export function createShareableLink(encryptedData, expiryMinutes, viewLimit) {
  const timestamp = Date.now();
  const expiry = expiryMinutes * 60 * 1000;
  
  const payload = {
    e: encryptedData.encryptedContent,
    i: encryptedData.iv,
    k: encryptedData.key,
    t: timestamp,
    x: expiry,
    v: viewLimit,
    p: encryptedData.passwordSalt ? 1 : 0,
    ps: encryptedData.passwordSalt,
    pi: encryptedData.passwordIv
  };
  
  const encoded = encodePayload(payload);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/view/${encoded}`;
}
