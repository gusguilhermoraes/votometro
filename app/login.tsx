import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar } from 'react-native-paper';
import { signInWithEmailAndPassword, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebaseconfig';
import { FontAwesome6, Feather } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useSocialAuth } from '../hooks/useSocialAuth';
import { GoogleSignin, User, isSuccessResponse } from "@react-native-google-signin/google-signin"
import { useTheme } from '@/context/ThemeContext';
import * as Haptics from 'expo-haptics';

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
	iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
	webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
	offlineAccess: true,
})

export default function Login() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [senha, setSenha] = useState('');
	const [showPassword, setShowPassword] = useState(false);

	const shakeAnimation = useRef(new Animated.Value(0)).current;

	const retornar = () => {
		router.back();
	};

	const inscreverSe = () => {
		router.replace('./cadastro');
	};

  	const [snackbarVisivel, setSnackbarVisivel] = useState(false);
  	const [mensagemErro, setMensagemErro] = useState('');

  	const { tema, coresAtuais } = useTheme();
  	const isDarkMode = tema === 'escuro';

	const { handleSocialCredential, loading } = useSocialAuth();

	// Função que executa o "Chacoalhar" estilo Telegram
	const dispararShake = () => {
	  // Sequência rápida de idas e voltas no eixo X
		Animated.sequence([
			Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
			Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
		]).start();
	};
	
	const mostrarErro = (mensagem: string) => {
		setMensagemErro(mensagem);
		dispararShake();
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		setSnackbarVisivel(true);
	};

	const mostrarSnackbarSenha = (mensagem: string) => {
		setMensagemErro(mensagem);
		setSnackbarVisivel(true);
	};

	const handleLogin = async () => {
		if (!email || !senha) {
			mostrarErro('Preencha o email e a senha.');
			return;
		}

		try {
			await signInWithEmailAndPassword(auth, email, senha);
			Alert.alert('Sucesso', 'Login realizado com sucesso!');
			router.replace('/home');
		} catch (error: any) {
			let mensagem = error.message;
			if (error.code === 'auth/invalid-credential') {
				mensagem = 'E-mail ou senha incorretos.';
			} else if (error.code === 'auth/too-many-requests') {
				mensagem = 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
			} else if (error.code === 'auth/user-not-found') {
				mensagem = 'Usuário não encontrado.';
			}
			mostrarErro(mensagem);
		}
	};

	async function handleGoogleSignIn(){
		try {
			await GoogleSignin.hasPlayServices()
			const response = await GoogleSignin.signIn()

			if(isSuccessResponse(response)) {
				const { idToken } = response.data;

				if (!idToken) {
					mostrarErro('Não foi possível obter o token do Google.'); 
					return;
				}

				const credential = GoogleAuthProvider.credential(idToken);

				await handleSocialCredential(credential, 'google');

			}

		} catch (error){
			console.log(error);
			mostrarErro('Não foi possível conectar com o Google.');
		}
	}

	function recoverPassword() {
		sendPasswordResetEmail(auth, email)
		.then(() => {
			console.log("E-mail de redefinição enviado com sucesso!");
			mostrarSnackbarSenha('E-mail de redefinição enviado com sucesso!');
			// Exiba uma mensagem de sucesso para o usuário
		})
		.catch((error) => {
			let mensagem = error.message;
			if (error.code === 'auth/missing-email') {
				mensagem = 'Por favor, insira um e-mail.';
			} else if (error.code === 'auth/invalid-email') {
				mensagem = 'E-mail inválido.';
			} else if (error.code === 'auth/user-not-found') {
				mensagem = 'Não existe nenhuma conta com este e-mail.';
			} else if (error.code === 'auth/too-many-requests') {
				mensagem = 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
			} else if (error.code === 'auth/network-request-failed') {
				mensagem = 'Ocorreu um erro na conexão com a internet. Verifique a conexão do dispositivo.';
			} 
			mostrarErro(mensagem);
		});
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={[styles.container, { backgroundColor: coresAtuais.primariaVerde }]}>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
				>
					<Animated.ScrollView 
						contentContainerStyle={styles.scroll}
						showsVerticalScrollIndicator={false}
            			style={{ transform: [{ translateX: shakeAnimation }] }}
					>
						<TouchableOpacity
						  style={styles.voltar}
						  onPress={retornar}
						>
						  <Feather name="arrow-left" size={22} color={isDarkMode ? "#000000" : "#009440"} />
						</TouchableOpacity>
						<View style={styles.cardLogin}>
							<Text style={styles.titulo}>Bem-vindo de volta!</Text>
							<Text style={styles.subtitulo}>Entre na sua conta para continuar</Text>
							<View style={styles.inputContainer}>
								<Feather name="mail" size={20} color="#8A8A8A" />
								<TextInput
									style={styles.input}
									placeholder="Insira seu email"
									value={email}
									onChangeText={setEmail}
									autoCapitalize="none"
									keyboardType="email-address"
									placeholderTextColor="#999"
								/>
							</View>
							<View style={styles.inputContainer}>
								<Feather name="lock" size={20} color="#8A8A8A" />
								<TextInput
									style={styles.input}
									placeholder="Insira sua senha"
									value={senha}
									onChangeText={setSenha}
									secureTextEntry={!showPassword}
									placeholderTextColor="#999"
								/>
								<Feather 
									name={showPassword ? 'eye' : 'eye-off'}
									size={20} 
									color="#8A8A8A" 
									onPress={() => setShowPassword(!showPassword)}
								/>
							</View>

							<Text 
								style={styles.esqueceu}
								onPress={recoverPassword}
							>
								Esqueceu a senha?
							</Text>

							<TouchableOpacity
								onPress={handleLogin}
								style={[styles.buttonlogin, { backgroundColor: coresAtuais.primariaVerde }]}
							>
								<Text style={styles.buttonText}>Entrar</Text>
							</TouchableOpacity>

							<View style={styles.divisor}>
								<View style={styles.linha} />
								<Text style={styles.textoDivisor}>ou</Text>
								<View style={styles.linha} />
							</View>

							<Text style={styles.tituloSocial}>
								Continuar com
							</Text>

							<View style={styles.containerSocial}>
								<TouchableOpacity 
									style={styles.botoesapps}
									onPress={handleGoogleSignIn}
								>
									<MaskedView
										maskElement={
											<FontAwesome6 
												name='google' 
												size={30} 
											/>
										}
									>
										<LinearGradient
											colors={['#4285F4', '#0F9D58', '#F4B400', '#DB4437']}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 1 }}
											style={{ width: 32, height: 32 }}
										/>
									</MaskedView>
									<Text style={styles.textoSocial}>Fazer login com Google</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.rodape}>
								<Text style={styles.rodapeTexto1}>Não tem conta? </Text>
								<Text style={styles.rodapeTexto2} onPress={inscreverSe}>
									Inscreva-se agora
								</Text>
							</View>
						</View>
					</Animated.ScrollView>
				</KeyboardAvoidingView>
			</SafeAreaView>

			{/* Componente de aviso flutuante dinâmico */}
			<Snackbar
				visible={snackbarVisivel}
				onDismiss={() => setSnackbarVisivel(false)}
				duration={3000}
				style={[
					styles.snackbar, 
					{ backgroundColor: coresAtuais.snackbarFundo || '#2b2b2b' },
					isDarkMode && styles.snackbarNeonBorder
				]}
				action={{
					label: 'OK',
					textColor: '#ff5252',
					onPress: () => setSnackbarVisivel(false),
				}}
			>
				<Text style={[styles.snackbarText, { color: coresAtuais.snackbarTexto || '#fff' }]}>
					{mensagemErro}
				</Text>
			</Snackbar>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scroll: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 25,
		paddingBottom: 30,
	},
	voltar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: "#FFF",
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 24,
		shadowColor: "#000",
		shadowOpacity: 0.05,
		shadowRadius: 10,
		shadowOffset: { 
			width: 0, 
			height: 4 
		},
		elevation: 4,
	},
	cardLogin: {
		backgroundColor: "#FFF",
		borderRadius: 28,
		padding: 24,
		shadowColor: "#000",
		shadowOpacity: 0.06,
		shadowRadius: 20,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		elevation: 5,
	},
	titulo: {
		fontSize: 28,
		fontFamily: 'Poppins_700Bold',
		color: '#1e232c',
		alignSelf: 'flex-start',
	},
	subtitulo: {
		fontSize: 22,
		fontFamily: 'Urbanist_500Medium',
		color: '#1e232c',
		marginBottom: 20,
		alignSelf: 'flex-start',
	},
	inputContainer: {
		height: 58,
		borderRadius: 16,
		marginBottom: 16,
		paddingHorizontal: 16,
		borderColor: '#E5E7EB',
		borderWidth: 1,
		flexDirection: "row",
    	alignItems: "center",
		fontFamily: 'Urbanist_500Medium',
	},
	input: {
		flex: 1,
		marginLeft: 12,
		fontSize: 16,
		color: "#111",
	},
	esqueceu: {
		alignSelf: 'flex-end',
		marginBottom: 20,
		color: '#0663EF',
		fontFamily: 'Urbanist_500Medium',
	},
	buttonlogin: {
		height: 58,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: "center",
		marginBottom: 28,
	},
	buttonText: {
		fontSize: 16,
		color: 'white',
		fontFamily: 'Urbanist_600SemiBold',
	},
	divisor: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 20,
		width: '100%',
	},
	linha: {
		flex: 1,
		height: 1,
		backgroundColor: '#ccc',
	},
	textoDivisor: {
		marginHorizontal: 10,
		color: '#555',
		fontFamily: 'Urbanist_500Medium',
	},
	tituloSocial: {
		textAlign: "center",
		marginBottom: 16,
		color: "#444",
		fontWeight: "600",
	},
	containerSocial: {
		gap: 12,
	
	},
	botoesapps: {
		backgroundColor: '#ffffff',
		borderColor: "#E5E7EB",
		borderRadius: 14,
		height: 60,
		flexDirection: "row",
		justifyContent: 'center',
		alignItems: 'center',
		elevation: 2,
	},
	textoSocial: {
		marginLeft: 10,
		fontSize: 15,
		fontWeight: "600",
		color: "#222",
	},
	rodape: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 15
	},
	rodapeTexto1: {
		fontSize: 15,
		fontFamily: 'Urbanist_500Medium',
		color: '#1E232C',
	},
	rodapeTexto2: {
		fontSize: 15,
		fontFamily: 'Urbanist_700Bold',
		color: '#0663EF',
	},
	snackbar: {
		borderRadius: 12,
		position: 'absolute',       // Garante que ele flutue fixo na base
		bottom: 20,                 // Distância do final da tela
		left: 15,
		right: 15,
		elevation: 4,               // Sombra no Android
	},
	snackbarText: {
		color: '#fff',
		fontWeight: '500',
	},
	snackbarNeonBorder: {
		borderWidth: 0.8,           // Borda bem pequena/fina
		borderColor: '#91dbd6',
		// Opcional: Adiciona um leve brilho no Android/iOS se desejar
		shadowColor: '#91dbd6',
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.5,
		shadowRadius: 5,
	}
});
