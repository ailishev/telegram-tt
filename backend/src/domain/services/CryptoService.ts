export interface CryptoService {
  encrypt(plainText: string): string;
  decrypt(cipherText: string): string;
}
