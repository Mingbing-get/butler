import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

export function encrypt(data: string) {
  const secret1 = process.env.SECRET1 || '';
  const secret2 = process.env.SECRET2 || '';

  const res1 = CryptoJS.AES.encrypt(data, secret1);
  const res2 = CryptoJS.AES.encrypt(res1.toString(), secret2);

  return res2.toString();
}

export function compare(encryptData: string, data: string) {
  const secret1 = process.env.SECRET1 || '';
  const secret2 = process.env.SECRET2 || '';
  const res1 = CryptoJS.AES.decrypt(encryptData, secret2).toString(
    CryptoJS.enc.Utf8
  );
  const res2 = CryptoJS.AES.decrypt(res1, secret1).toString(CryptoJS.enc.Utf8);

  return res2 === data;
}
