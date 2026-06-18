// hooks/useSocialAuth.ts
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseconfig';

WebBrowser.maybeCompleteAuthSession();

export type PendingUser = {
  uid: string;
  email: string;
  username: string;
  provider: string;
};

export function useSocialAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Após login social bem-sucedido, verifica se o usuário já tem perfil no Firestore
  const handleSocialCredential = async (credential: any, providerName: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // Verifica se já existe documento no Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));

      if (userDoc.exists()) {
        // ✅ Usuário já cadastrado → vai direto para Home
        router.replace('/home');
      } else {
        // 🆕 Usuário novo → manda para etapa 2 do cadastro
        router.push({
          pathname: '/cadastro-social',
          params: {
            uid: user.uid,
            email: user.email ?? '',
            username: user.displayName ?? '',
            provider: providerName,
          },
        });
      }
    } catch (error: any) {
      console.error('Erro no login social:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { handleSocialCredential, loading };
}