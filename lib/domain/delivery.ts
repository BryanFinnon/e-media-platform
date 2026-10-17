import {detectImageType} from './image-upload';
export function detectDeliveryType(bytes:Uint8Array) {
 const image=detectImageType(bytes);if(image)return image;
 const signature=String.fromCharCode(...bytes.slice(4,8));
 if(bytes.length>16&&signature==='ftyp')return 'video/mp4';
 if(bytes.length>16&&bytes[0]===0x1a&&bytes[1]===0x45&&bytes[2]===0xdf&&bytes[3]===0xa3)return 'video/webm';
 return null;
}
export function safeFilename(name:string) {return name.replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,120)||'delivery';}
