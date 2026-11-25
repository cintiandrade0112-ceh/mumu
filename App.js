import 'react-native-url-polyfill/auto';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, ScrollView,
  StyleSheet, SafeAreaView, Alert, Share, ActivityIndicator,
  Switch, Platform, Modal, StatusBar, Image, Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Updates from 'expo-updates';
import { createClient } from '@supabase/supabase-js';

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://nxxshxvlsayapomfcvvi.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54eHNoeHZsc2F5YXBvbWZjdnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwMDg3NDEsImV4cCI6MjEwOTU4NDc0MX0.7d6KNKNmfc2KQdxW-E-ErW11m_Xd_r4fySbqOtqV-Vk';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── CONSTANTES ──────────────────────────────────────────────────────────────
const C = {
  accent: '#1F7A6D',
  foco:   '#3F5FB5',
  casa:   '#C98A1B',
  filha:  '#C2517A',
  pausa:  '#5A9A5E',
  bg:     '#F2F6F7',
  card:   '#FFFFFF',
  ink:    '#1D2B36',
  mute:   '#62727E',
  line:   '#DCE4E8',
};

const TYPES = {
  foco:      { n: 'Trabalho em casa',   c: '#2980B9' },
  foco_fora: { n: 'Trabalho fora',      c: '#1E3A8A' },
  filha:     { n: 'Cuidado infantil',   c: C.filha },
  casa:      { n: 'Casa',               c: C.casa },
  pausa:     { n: 'Pausa',              c: C.pausa },
  sono:      { n: 'Hora de dormir',     c: '#5B4D9E' },
  passeio:   { n: 'Passeio em família', c: '#E67E22' },
  descanso:  { n: 'Descanso e lazer',   c: '#27AE60' },
};

const TK = Object.keys(TYPES);

const SHARED_ITEMS = [
  ['agenda', 'Agenda', C.foco],
  ['casa', 'Casa', C.casa],
  ['celine', 'Cuidado infantil', C.filha],
  ['nos', 'Nós', C.accent],
];

const PRIVATE_ITEMS = [
  ['trabalho', 'Trabalho e foco', '#2980B9'],
  ['eu', 'Tempo livre e autocuidado', C.pausa],
  ['minhas_notas', 'Notas particulares', '#8E44AD'],
  ['minhas_tarefas', 'Tarefas particulares', '#2E7D32'],
];

const ALL_ITEMS = [...SHARED_ITEMS, ...PRIVATE_ITEMS];
const TAB_NAMES = { ...Object.fromEntries(ALL_ITEMS.map(([k, n]) => [k, n])), ideias: 'Nós' };
const IS_PRIVATE_TAB = {
  trabalho: true,
  eu: true,
  minhas_notas: true,
  minhas_tarefas: true,
};

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, 36) : 0;
const DN = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const DEFAULT_CARE = [
  ['08:00', 'Acordar, trocar a fralda e primeira refeição', 'c1'],
  ['08:45', 'Café da manhã', 'c2'],
  ['10:00', 'Soneca da manhã', 'c3'],
  ['11:00', 'Brincar junto', 'c4'],
  ['12:00', 'Fruta e água', 'c5'],
  ['13:00', 'Almoço em família e da criança', 'c6'],
  ['13:45', 'Soneca da tarde', 'c7'],
  ['15:30', 'Lanche da tarde com fruta', 'c8'],
  ['16:30', 'Brincar ou passear com a criança', 'c9'],
  ['18:30', 'Jantar', 'c10'],
  ['19:15', 'Banho e troca de roupa', 'c11'],
  ['20:00', 'Livrinho, leite e hora de dormir', 'c12'],
];

const DEFAULT_SELF = [
  { i: 's1', x: '20 minutos só para mim' },
  { i: 's2', x: 'Alongar ou caminhar por 10 minutos' },
  { i: 's3', x: 'Tomar sol ou ar livre por 10 minutos' },
  { i: 's4', x: 'Fazer uma refeição sem pressa' },
  { i: 's5', x: 'Cuidar da pele ou do cabelo' },
  { i: 's6', x: 'Ir dormir no horário que combinei comigo' },
];

const PSEED = [
  ['Feijão carioca', 2, 1, 0],
  ['Feijão preto', 1, 1, 0],
  ['Arroz branco', 2, 1, 0],
  ['Macarrão espaguete', 2, 1, 0],
  ['Molho de tomate', 3, 2, 0],
  ['Azeite de oliva', 1, 1, 0],
  ['Alho e cebola', 1, 1, 0],
  ['Ovos (dúzia)', 2, 1, 0],
  ['Peito de frango', 2, 1, 0],
  ['Carne moída', 2, 1, 0],
  ['Batatas e legumes', 3, 1, 0],
  ['Queijo ralado', 2, 1, 0],
  ['Frutas da semana', 5, 2, 0],
  ['Papinhas e alimentos infantis', 4, 2, 1],
  ['Fraldas infantis (pacote)', 2, 1, 1],
  ['Lenço umedecido', 3, 1, 1],
  ['Detergente', 2, 1, 2],
  ['Sabão para roupa', 1, 1, 2],
  ['Papel higiênico', 6, 3, 3],
];

const DEFAULT_MENU_PRESET = [
  { dish: 'Espaguete com molho de tomate e queijo', ingredients: 'Macarrão espaguete, Molho de tomate, Queijo ralado, Alho e cebola' },
  { dish: 'Arroz, feijão fresco, frango grelhado e salada', ingredients: 'Arroz branco, Feijão carioca, Peito de frango, Alho e cebola, Azeite de oliva' },
  { dish: 'Carne moída refogada com batatas, arroz e feijão', ingredients: 'Carne moída, Batatas e legumes, Arroz branco, Feijão carioca, Alho e cebola' },
  { dish: 'Filé de frango ao molho com purê de batata', ingredients: 'Peito de frango, Batatas e legumes, Alho e cebola, Azeite de oliva' },
  { dish: 'Feijão preto com carne refogada e arroz', ingredients: 'Feijão preto, Carne moída, Arroz branco, Alho e cebola' },
  { dish: 'Arroz, feijão, ovos fritos e legumes na manteiga', ingredients: 'Arroz branco, Feijão carioca, Ovos (dúzia), Batatas e legumes' },
  { dish: 'Pizza caseira rápida ou lanche a dois', ingredients: 'Massa rápida, Molho de tomate, Queijo ralado, Orégano' },
];

const PC = ['Comida', 'Infantil', 'Limpeza', 'Higiene'];

const IDEAS_CASAL = [
  'Jantar à luz de velas na sala, sem telas',
  'Esconda um bilhete carinhoso onde o parceiro vai achar amanhã',
  'Massagem de 10 minutos para cada um',
  'Piquenique na sala com petiscos e uma lista de músicas de vocês',
  'Escrevam 3 coisas que admiram um no outro e leiam em voz alta',
  'Dancem uma música só, abraçados, na cozinha',
];

const IDEAS_JOGOS = [
  'Quem sabe mais? Façam 10 perguntas sobre o outro',
  'Baralho ou Uno valendo uma massagem',
  'Quebra-cabeça na sala, um pouco por noite',
  'Verdade ou desafio, versão carinhosa',
  'Perguntas profundas: uma por noite, sem celular',
];

const IDEAS_CELINE = [
  'Cesta de tesouros com colheres e copos leves',
  'Túnel de caixa de papelão grande para brincar',
  'Empilhar e derrubar blocos ou copos',
  'Brincadeira de música com panelinhas',
  'Esconde-achou com um paninho leve',
  'Bolhas de sabão para ela tentar pegar',
  'Dança na sala com canções animadas',
];

const IDEAS_EU = [
  'Chá quente sem celular, por 10 minutos',
  'Banho demorado com música relaxante',
  'Alongamento de 10 minutos',
  'Escrever 3 coisas boas do dia',
  'Deitar e respirar fundo por 5 minutos',
];

const CQ = [
  'O que eu posso fazer para te ajudar mais esta semana?',
  'Qual foi o melhor momento nosso nesta semana?',
  'O que você precisa de mim e ainda não pediu?',
  'Algo que eu fiz e que te deixou feliz?',
  'O que você gostaria de fazer só nós dois?',
  'Que tarefa da casa pesa mais para você agora?',
];

const DEFAULT_CLEAN = [
  ['Descanso da casa e planejamento leve', 10],
  ['Cozinha: bancada, pia, fogão e chão rápido', 15],
  ['Casa de banho: vaso sanitário, pia, espelho e piso', 15],
  ['Dois quartos: arejar, arrumar camas, guardar roupas e pó', 20],
  ['Sala e corredor: organizar superfícies, varrer e passar pano', 15],
  ['Varanda: varrer chão, organizar e regar plantas', 15],
  ['Manutenção a dois: roupas da semana e revisão leve conjunta', 20],
];

const HOUSE_DIVISIONS = [
  { id: 'cozinha', name: 'Cozinha', dayIdx: 1, day: 'Segunda', task: 'Bancada, fogão, pia e chão rápido', min: 15, checklist: ['Lavar e guardar louças', 'Limpar fogão e bancada', 'Esvaziar lixeira da cozinha', 'Passar pano rápido no chão'] },
  { id: 'banho', name: 'Casa de banho', dayIdx: 2, day: 'Terça', task: 'Vaso sanitário, pia, espelho e piso', min: 15, checklist: ['Higienizar vaso sanitário', 'Limpar pia e espelho', 'Trocar toalha de rosto', 'Passar pano no piso'] },
  { id: 'quartos', name: 'Dois quartos', dayIdx: 3, day: 'Quarta', task: 'Arejar, arrumar camas, guardar roupas e pó', min: 20, checklist: ['Abrir janelas para arejar', 'Arrumar camas dos dois quartos', 'Recolher roupas fora do lugar', 'Limpar poeira das superfícies'] },
  { id: 'sala_corredor', name: 'Sala e corredor', dayIdx: 4, day: 'Quinta', task: 'Organizar superfícies, varrer e passar pano', min: 15, checklist: ['Organizar almofadas e mantas', 'Desimpedir corredor e mesas', 'Varrer ou aspirar piso', 'Passar pano rápido'] },
  { id: 'varanda', name: 'Varanda', dayIdx: 5, day: 'Sexta', task: 'Varrer chão, organizar e regar plantas', min: 15, checklist: ['Varrer piso da varanda', 'Regar plantas', 'Recolher calçados e itens da varanda'] },
  { id: 'manutencao', name: 'Manutenção a dois', dayIdx: 6, day: 'Sábado', task: 'Roupas da semana e revisão leve conjunta', min: 20, checklist: ['Lavar ou dobrar roupas da semana', 'Revisão leve de itens espalhados a dois'] },
  { id: 'descanso', name: 'Descanso da casa', dayIdx: 0, day: 'Domingo', task: 'Casa em ordem e planejamento da nova semana', min: 10, checklist: ['Pias desimpedidas', 'Planejar a rotina da semana', 'Aproveitar o descanso'] },
];

const MANJAR_WEEKLY_MENU = {
  Segunda: {
    almoco: 'Arroz, feijão carioca, filé de frango grelhado e cenoura no vapor',
    jantar: 'Sopa reconfortante de abóbora com carne macia e legumes',
  },
  Terça: {
    almoco: 'Macarrão com molho caseiro de tomate, carne moída e brócolis',
    jantar: 'Omelete de forno com legumes e purê de batata',
  },
  Quarta: {
    almoco: 'Peixe assado com batatas coradas e legumes salteados',
    jantar: 'Arroz integral, lentilhas bem cozidas e abobrinha refogada',
  },
  Quinta: {
    almoco: 'Arroz com lentilha, frango desfiado e purê de abobrinha',
    jantar: 'Creme de mandioquinha com frango desfiado e espinafre',
  },
  Sexta: {
    almoco: 'Arroz, feijão preto, carne cozida em pedaços macios e chuchu',
    jantar: 'Torta caseira de legumes com frango e salada',
  },
  Sábado: {
    almoco: 'Arroz de forno colorido com legumes, milho e frango desfiado',
    jantar: 'Caldo verde suave com batata, couve fresca e azeite extravirgem',
  },
  Domingo: {
    almoco: 'Frango assado em família com batatas e legumes grelhados',
    jantar: 'Sanduíche natural no pão integral ou sopa leve de legumes',
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const pad    = n => String(n).padStart(2, '0');
const todayS = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const wkKey  = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const d7     = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const norm   = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// ─── NOTIFICAÇÕES ─────────────────────────────────────────────────────────────
async function ensurePerm() {
  try {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      return true;
    }
    const c = await Notifications.getPermissionsAsync();
    let granted = c.status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted && typeof window !== 'undefined' && typeof window.Notification !== 'undefined') {
      const perm = await window.Notification.requestPermission();
      return perm === 'granted';
    }
    if (!granted) return false;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('lembretes-rotina', {
          name: 'Lembretes da rotina',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1F7A6D',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: false,
          sound: 'default',
        });
      } catch (_) {}
    }
    return true;
  } catch (_) {
    return false;
  }
}

function parseTime(hhmm) {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) {
    return { hour: 8, minute: 0 };
  }
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return { hour: 8, minute: 0 };
  return { hour: h, minute: m };
}

let routineDesktopInterval = null;
let firedDesktopReminders = new Set();

async function scheduleAll(list) {
  if (typeof window !== 'undefined') {
    if (routineDesktopInterval) clearInterval(routineDesktopInterval);
    routineDesktopInterval = setInterval(() => {
      const now = new Date();
      const currentH = String(now.getHours()).padStart(2, '0');
      const currentM = String(now.getMinutes()).padStart(2, '0');
      const currentHM = `${currentH}:${currentM}`;
      const dayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

      for (const r of (list || [])) {
        if (r.time === currentHM) {
          const fireKey = `${dayKey}_${r.time}_${r.title}`;
          if (!firedDesktopReminders.has(fireKey)) {
            firedDesktopReminders.add(fireKey);
            notifyInstant(r.title, r.body);
          }
        }
      }
    }, 30000);
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const DAILY = (Notifications.SchedulableTriggerInputTypes && Notifications.SchedulableTriggerInputTypes.DAILY) || 'daily';
    for (const r of list) {
      const { hour, minute } = parseTime(r.time);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: r.title || 'Rotina da agenda',
          body: r.body,
          sound: true,
          channelId: 'lembretes-rotina',
        },
        trigger: {
          type: DAILY,
          hour,
          minute,
          channelId: 'lembretes-rotina',
        },
      });
    }
  } catch (err) {
    console.warn('Lembretes:', err);
  }
}

let lastNotifKey = '';
let lastNotifTime = 0;
async function notifyInstant(title, body) {
  if (!title || !body) return;
  const key = `${title}:${body}`;
  const now = Date.now();
  if (key === lastNotifKey && now - lastNotifTime < 3000) return;
  lastNotifKey = key;
  lastNotifTime = now;

  if (typeof window !== 'undefined' && window.electronAPI?.sendNotification) {
    window.electronAPI.sendNotification(title, body);
  } else if (typeof window !== 'undefined' && typeof window.Notification !== 'undefined' && window.Notification.permission === 'granted') {
    try { new window.Notification(title, { body }); } catch (_) {}
  }

  try {
    if (await ensurePerm()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          channelId: 'lembretes-rotina',
        },
        trigger: null,
      });
    }
  } catch (err) {
    console.warn('Notificação instantânea:', err);
  }
}

// ─── TELA DE AUTENTICAÇÃO ─────────────────────────────────────────────────────
function Auth() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const go = async signup => {
    const fn = signup ? sb.auth.signUp : sb.auth.signInWithPassword;
    const { data, error } = await fn.call(sb.auth, { email: email.trim(), password: pw });
    if (error) {
      if (error.message.includes('rate limit')) {
        Alert.alert(
          'Limite temporário de e-mails',
          'O envio de novos e-mails atingiu o limite temporário. Para entrar agora sem esperar, desative a opção "Confirm email" no painel do Supabase.'
        );
      } else {
        Alert.alert('Erro', error.message);
      }
    } else if (signup && !data?.session) {
      Alert.alert('Conta criada', 'Toque em Entrar para acessar.');
    }
  };
  return (
    <SafeAreaView style={[s.screen, { justifyContent: 'center' }]}>
      <ScrollView contentContainerStyle={s.pad}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Image source={require('./assets/logo.png')} style={{ width: 104, height: 104, resizeMode: 'contain', marginBottom: 12 }} />
          <Text style={{ fontSize: 28, fontWeight: '800', color: C.ink, letterSpacing: -0.5 }}>Mumu</Text>
          <Text style={[s.sub, { marginTop: 4, textAlign: 'center' }]}>Um + um = nós dois</Text>
        </View>
        <TextInput style={s.inp} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput style={s.inp} placeholder="Senha (mín. 6 caracteres)" secureTextEntry value={pw} onChangeText={setPw} />
        <Btn t="Entrar" onPress={() => go(false)} />
        <Btn t="Criar conta" ghost onPress={() => go(true)} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── TELA DE SETUP ────────────────────────────────────────────────────────────
function Setup({ onDone }) {
  const [name, setName] = useState('');
  const [house, setHouse] = useState('Nossa casa');
  const [code, setCode] = useState('');
  const run = async (fn, args) => {
    if (!name.trim()) return Alert.alert('Falta o seu nome');
    const { error } = await sb.rpc(fn, args);
    if (error) Alert.alert('Erro', error.message);
    else onDone();
  };
  return (
    <SafeAreaView style={[s.screen, { justifyContent: 'center' }]}>
      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.h1}>Quase lá</Text>
        <TextInput style={s.inp} placeholder="Seu nome" value={name} onChangeText={setName} />
        <Text style={s.sub}>Primeira pessoa: crie a casa e passe o código para o companheiro.</Text>
        <TextInput style={s.inp} placeholder="Nome da casa" value={house} onChangeText={setHouse} />
        <Btn t="Criar a casa" onPress={() => run('create_household', { p_name: house, p_my_name: name.trim() })} />
        <Text style={[s.sub, { marginTop: 16 }]}>Segunda pessoa: use o código recebido.</Text>
        <TextInput style={s.inp} placeholder="Código da casa" autoCapitalize="none" value={code} onChangeText={setCode} />
        <Btn t="Entrar com código" ghost onPress={() => run('join_household', { p_code: code, p_my_name: name.trim() })} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [home, setHome] = useState(undefined);

  useEffect(() => {
    let mounted = true;

    // Recupera a sessão local no aparelho sem travar caso esteja offline
    sb.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data?.session || null);
        setReady(true);
      }
    }).catch(() => {
      if (mounted) setReady(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (mounted) setSession(s);
    });

    // Limite máximo de espera: libera a tela em 1,2s mesmo sem conexão
    const timer = setTimeout(() => {
      if (mounted) setReady(true);
    }, 1200);

    return () => {
      mounted = false;
      clearTimeout(timer);
      sub?.subscription?.unsubscribe();
    };
  }, []);

  const loadHome = useCallback(async () => {
    if (!session?.user?.id) return;
    const cacheKey = 'mt-cached-home-' + session.user.id;

    // 1. Carrega imediatamente do armazenamento local para abrir na hora sem internet
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setHome(JSON.parse(cached));
      }
    } catch (_) {}

    // 2. Em segundo plano, busca novidades no servidor caso haja internet
    try {
      const { data, error } = await sb
        .from('members')
        .select('household_id,name,households(name,code)')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setHome(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
        return;
      }
    } catch (_) {}

    // Se ainda não tiver home (primeiro acesso da conta)
    setHome(prev => (prev !== undefined ? prev : null));
  }, [session]);

  useEffect(() => {
    if (session) {
      loadHome();
    }
  }, [session, loadHome]);

  if (!ready) return <View style={[s.screen, { justifyContent: 'center' }]}><ActivityIndicator /></View>;
  if (!session) return <Auth />;
  if (home === undefined) return <View style={[s.screen, { justifyContent: 'center' }]}><ActivityIndicator /></View>;
  if (home === null) return <Setup onDone={loadHome} />;
  return <Main home={home} uid={session.user.id} />;
}

// ─── COMPONENTES REUTILIZÁVEIS ────────────────────────────────────────────────
const Btn = ({ t, onPress, ghost, small }) => (
  <TouchableOpacity style={[s.btn, ghost && s.ghost, small && { padding: 8, marginBottom: 4 }]} onPress={onPress}>
    <Text style={[s.btnT, ghost && { color: C.accent }, small && { fontSize: 13 }]}>{t}</Text>
  </TouchableOpacity>
);

const Card = ({ children, color, style }) => (
  <View style={[s.card, color && { borderLeftColor: color }, style]}>{children}</View>
);

const Sub = ({ children }) => <Text style={s.sub}>{children}</Text>;

// ─── RESOLUÇÃO INTELIGENTE DE ROTINA DO CASAL ────────────────────────────────
function resolveProfiles(wp, uid, partnerId, myName, partnerName) {
  const defaultBedCeline = wp?.bedCeline ?? 20;
  const defaultBedCasal = wp?.bedCasal ?? 22;

  // 1. Configuração direta por id de usuário
  if (wp?.byUser && (wp.byUser[uid] || (partnerId && wp.byUser[partnerId]))) {
    const myP = wp.byUser[uid] || {};
    const partP = (partnerId ? wp.byUser[partnerId] : null) || {};

    const myMode = myP.mode || wp.myMode || 'casa';
    const myStart = myP.start ?? wp.myStart ?? 8;
    const myEnd = myP.end ?? wp.myEnd ?? 17;
    const myArrival = myP.arrival ?? myEnd;

    const partnerMode = partP.mode || (myMode === 'casa' ? 'fora' : 'casa');
    const partnerStart = partP.start ?? wp.partnerStart ?? 8;
    const partnerEnd = partP.end ?? wp.partnerEnd ?? 16;
    const partnerArrival = partP.arrival ?? wp.partnerArrival ?? partnerEnd;

    const iAmCreator = wp.creatorId ? wp.creatorId === uid : true;

    return {
      my: { mode: myMode, start: myStart, end: myEnd, arrival: myArrival },
      partner: { mode: partnerMode, start: partnerStart, end: partnerEnd, arrival: partnerArrival },
      bedCeline: defaultBedCeline,
      bedCasal: defaultBedCasal,
      iAmCreator,
    };
  }

  // 2. Formato legado: identificar se o usuário atual é o autor original
  let iAmCreator = true;
  if (wp?.creatorId) {
    iAmCreator = wp.creatorId === uid;
  } else if (wp?.partnerName && myName) {
    const cleanP = wp.partnerName.trim().toLowerCase();
    const cleanMy = myName.trim().toLowerCase();
    if (cleanP === cleanMy) {
      iAmCreator = false;
    }
  }

  if (iAmCreator) {
    return {
      my: {
        mode: wp?.myMode || 'casa',
        start: wp?.myStart ?? 8,
        end: wp?.myEnd ?? 17,
        arrival: wp?.myEnd ?? 17,
      },
      partner: {
        mode: wp?.partnerMode || 'fora',
        start: wp?.partnerStart ?? 8,
        end: wp?.partnerEnd ?? 16,
        arrival: wp?.partnerArrival ?? 16,
      },
      bedCeline: defaultBedCeline,
      bedCasal: defaultBedCasal,
      iAmCreator: true,
    };
  }

  return {
    my: {
      mode: wp?.partnerMode || 'fora',
      start: wp?.partnerStart ?? 8,
      end: wp?.partnerEnd ?? 16,
      arrival: wp?.partnerArrival ?? 16,
    },
    partner: {
      mode: wp?.myMode || 'casa',
      start: wp?.myStart ?? 8,
      end: wp?.myEnd ?? 17,
      arrival: wp?.myEnd ?? 17,
    },
    bedCeline: defaultBedCeline,
    bedCasal: defaultBedCasal,
    iAmCreator: false,
  };
}

// ─── TELA PRINCIPAL ───────────────────────────────────────────────────────────
function Main({ home, uid }) {
  const hid = home.household_id;
  const [tab, setTab] = useState('agenda');
  const [menuOpen, setMenuOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [slots, setSlots] = useState({});
  const [tasks, setTasks] = useState([]);
  const [care, setCare] = useState([]);
  const [careDone, setCareDone] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [menu, setMenu] = useState({});
  const [notes, setNotes] = useState([]);
  const [cks, setCks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [plan, setPlan] = useState(null);
  const [cfgCare, setCfgCare] = useState(DEFAULT_CARE);
  const [cfgClean, setCfgClean] = useState(DEFAULT_CLEAN);
  const [cfgIdeas, setCfgIdeas] = useState({});
  const [cfgDate, setCfgDate] = useState({ d: 5, t: '20:30' });
  const [cfgHeavy, setCfgHeavy] = useState('');
  const [hs, setHs] = useState(8);
  const [he, setHe] = useState(17);
  const [partnerHours, setPartnerHours] = useState({ s: 8, e: 16 });
  const [partnerSlots, setPartnerSlots] = useState({});
  const [bedtime, setBedtime] = useState({ celine: 20, casal: 22 });
  const [workProfile, setWorkProfile] = useState({
    myMode: 'casa',
    myStart: 8,
    myEnd: 17,
    partnerName: '',
    partnerMode: 'fora',
    partnerStart: 8,
    partnerEnd: 16,
    partnerArrival: 16,
    bedCeline: 20,
    bedCasal: 22,
  });
  const [weekendSlots, setWeekendSlots] = useState({});
  const [dailyNotes, setDailyNotes] = useState({});
  const [selfData, setSelfData] = useState(null);
  const [privateNotes, setPrivateNotes] = useState([]);
  const [privateTasks, setPrivateTasks] = useState([]);
  const [workTasks, setWorkTasks] = useState([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [remOn, setRemOn] = useState(true);

  useEffect(() => {
    if (tab === 'ideias') {
      setTab('nos');
    }
  }, [tab]);

  const seeded = useRef(false);
  const reloadTimer = useRef(null);

  const partner = members.find(x => x.user_id !== uid);
  const partnerName = partner?.name || '';
  const partnerId = partner?.user_id || null;
  const myName = home?.name || (members.find(x => x.user_id === uid)?.name) || 'Você';

  const effectivePartnerName = partnerName || (workProfile.partnerName && workProfile.partnerName.trim().toLowerCase() !== (myName || '').trim().toLowerCase() ? workProfile.partnerName : '') || 'Parceiro(a)';

  const nameOf = id => (members.find(x => x.user_id === id) || {}).name || 'Ninguém';
  const whoOf  = id => id === uid ? 'Você' : (nameOf(id) === 'Ninguém' ? effectivePartnerName : nameOf(id));
  const cycleWho = cur => {
    const ids = [...members.map(x => x.user_id), null];
    return ids[(ids.indexOf(cur ?? null) + 1) % ids.length];
  };

  // Carrega e salva cache local para funcionamento sem internet
  const cacheRef = useRef({});

  const saveOfflineCache = useCallback(async patch => {
    try {
      cacheRef.current = { ...cacheRef.current, ...patch };
      await AsyncStorage.setItem('mt-cache-' + hid, JSON.stringify(cacheRef.current));
    } catch (_) {}
  }, [hid]);

  const applyOfflineCache = async () => {
    try {
      const raw = await AsyncStorage.getItem('mt-cache-' + hid);
      if (raw) {
        const c = JSON.parse(raw);
        cacheRef.current = c;
        if (c.members) setMembers(c.members);
        if (c.slots) setSlots(c.slots);
        if (c.tasks) setTasks(c.tasks);
        if (c.care) setCare(c.care);
        if (c.careDone) setCareDone(c.careDone);
        if (c.pantry) setPantry(c.pantry);
        if (c.menu) setMenu(c.menu);
        if (c.notes) setNotes(c.notes);
        if (c.cks) setCks(c.cks);
        if (c.logs) setLogs(c.logs);
        if (c.plan !== undefined) setPlan(c.plan);
        if (c.cfgClean) setCfgClean(c.cfgClean);
        if (c.cfgIdeas) setCfgIdeas(c.cfgIdeas);
        if (c.cfgDate) setCfgDate(c.cfgDate);
        if (c.hs) setHs(c.hs);
        if (c.he) setHe(c.he);
        if (c.partnerHours) setPartnerHours(c.partnerHours);
        if (c.partnerSlots) setPartnerSlots(c.partnerSlots);
        if (c.bedtime) setBedtime(c.bedtime);
        if (c.roles) setRoles(c.roles);
        if (c.workProfile) setWorkProfile(c.workProfile);
        if (c.weekendSlots) setWeekendSlots(c.weekendSlots);
        if (c.dailyNotes) setDailyNotes(c.dailyNotes);
      }
    } catch (_) {}
  };

  // Carrega notas e tarefas particulares exclusivas deste aparelho
  useEffect(() => {
    (async () => {
      try {
        const pn = await AsyncStorage.getItem('mt-priv-notes-' + uid);
        if (pn) setPrivateNotes(JSON.parse(pn));
        const pt = await AsyncStorage.getItem('mt-priv-tasks-' + uid);
        if (pt) setPrivateTasks(JSON.parse(pt));
        const wt = await AsyncStorage.getItem('mt-work-tasks-' + uid);
        if (wt) setWorkTasks(JSON.parse(wt));
        const dc = await AsyncStorage.getItem('mt-work-closed-' + todayS() + '-' + uid);
        if (dc) setDayClosed(dc === '1');
      } catch (_) {}
    })();
  }, [uid]);

  const savePrivateNotes = async list => {
    setPrivateNotes(list);
    await AsyncStorage.setItem('mt-priv-notes-' + uid, JSON.stringify(list));
  };

  const savePrivateTasks = async list => {
    setPrivateTasks(list);
    await AsyncStorage.setItem('mt-priv-tasks-' + uid, JSON.stringify(list));
  };

  const saveWorkTasks = async list => {
    setWorkTasks(list);
    await AsyncStorage.setItem('mt-work-tasks-' + uid, JSON.stringify(list));
    await sb.from('config').upsert({ household_id: hid, key: 'work_tasks_' + uid, value: list }, { onConflict: 'household_id,key' }).catch(() => {});
  };

  const closeWorkDay = async () => {
    setDayClosed(true);
    await AsyncStorage.setItem('mt-work-closed-' + todayS() + '-' + uid, '1');
  };

  const reopenWorkDay = async () => {
    setDayClosed(false);
    await AsyncStorage.removeItem('mt-work-closed-' + todayS() + '-' + uid);
  };

  // Carregamento principal dos dados compartilhados
  useEffect(() => {
    AsyncStorage.getItem('mt-rem').then(v => setRemOn(v !== '0'));
    applyOfflineCache();

    const load = async () => {
      try {
        const [m, sl, t, ci, cd, pa, mn, no, ck, lg] = await Promise.all([
          sb.from('members').select('user_id,name').eq('household_id', hid),
          sb.from('slots').select('*').eq('household_id', hid),
          sb.from('tasks').select('*').eq('household_id', hid).order('created_at'),
          sb.from('care_items').select('*').eq('household_id', hid).order('hhmm'),
          sb.from('care_done').select('*').eq('household_id', hid).eq('day', todayS()),
          sb.from('pantry').select('*').eq('household_id', hid).order('created_at'),
          sb.from('menu').select('*').eq('household_id', hid),
          sb.from('notes').select('*').eq('household_id', hid).order('created_at', { ascending: false }).limit(10),
          sb.from('checkin').select('*').eq('household_id', hid).eq('wk', wkKey()),
          sb.from('log').select('*').eq('household_id', hid).gte('day', d7()),
        ]);

        let membersData = m.data || [];
        if (m.data) setMembers(m.data);

        let slotsObj = {};
        if (sl.data) {
          sl.data.forEach(x => { slotsObj['h' + x.hour] = x; });
          setSlots(slotsObj);
        }

        if (t.data) setTasks(t.data);

        if (ci.data) {
          if (ci.data.length === 0 && !seeded.current) {
            seeded.current = true;
            await sb.from('care_items').upsert(
              DEFAULT_CARE.map(([hhmm, label]) => ({ household_id: hid, hhmm, label })),
              { onConflict: 'household_id,hhmm,label', ignoreDuplicates: true }
            );
            return load();
          }
          setCare(ci.data);
        }

        if (cd.data) setCareDone(cd.data);
        if (pa.data) setPantry(pa.data);

        let menuObj = {};
        if (mn.data) {
          mn.data.forEach(x => { menuObj[x.day_of_week] = x; });
          setMenu(menuObj);
        }

        if (no.data) setNotes(no.data);
        if (ck.data) setCks(ck.data);
        if (lg.data) setLogs(lg.data);

        // Configurações e propostas ao parceiro
        const [cc, cl, ci2, ch, chv, chs, csel, cph, cps, cbd, cplan, croles, cweekend, cdaynotes, cwp] = await Promise.all([
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'care').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'clean').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'ideas').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'date').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'heavy').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'hours').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'self_' + uid).maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'partner_hours').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'partner_slots').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'bedtime').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'plan').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'roles').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'weekend_slots').maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'day_notes_' + todayS()).maybeSingle(),
          sb.from('config').select('*').eq('household_id', hid).eq('key', 'work_profile').maybeSingle(),
        ]);

        if (cc.data?.value) setCfgCare(cc.data.value);
        if (cl.data?.value) setCfgClean(cl.data.value);
        if (ci2.data?.value) setCfgIdeas(ci2.data.value);
        if (ch.data?.value) setCfgDate(ch.data.value);
        if (chv.data?.value) setCfgHeavy(chv.data.value.day || '');
        if (chs.data?.value) { setHs(chs.data.value.s || 8); setHe(chs.data.value.e || 17); }
        if (csel.data?.value) setSelfData(csel.data.value);
        if (cph.data?.value) setPartnerHours(cph.data.value);
        if (cps.data?.value) setPartnerSlots(cps.data.value);
        if (cbd.data?.value) setBedtime(cbd.data.value);
        setPlan(cplan.data?.value || null);
        if (croles.data?.value) setRoles(croles.data.value);
        if (cweekend.data?.value) setWeekendSlots(cweekend.data.value);
        if (cdaynotes.data?.value) setDailyNotes(cdaynotes.data.value);
        if (cwp.data?.value) setWorkProfile(prev => ({ ...prev, ...cwp.data.value }));

        // Salva cópia local no dispositivo para abrir sem conexão
        const serverSnapshot = {
          members: membersData,
          slots: slotsObj,
          tasks: t.data || [],
          care: ci.data || [],
          careDone: cd.data || [],
          pantry: pa.data || [],
          menu: menuObj,
          notes: no.data || [],
          cks: ck.data || [],
          logs: lg.data || [],
          plan: cplan.data?.value || null,
          cfgClean: cl.data?.value || DEFAULT_CLEAN,
          cfgIdeas: ci2.data?.value || {},
          cfgDate: ch.data?.value || { d: 5, t: '20:30' },
          hs: chs.data?.value?.s || 8,
          he: chs.data?.value?.e || 17,
          partnerHours: cph.data?.value || { s: 8, e: 16 },
          partnerSlots: cps.data?.value || {},
          bedtime: cbd.data?.value || { celine: 20, casal: 22 },
          roles: croles.data?.value || { homeUser: null, outsideUser: null },
          weekendSlots: cweekend.data?.value || {},
          dailyNotes: cdaynotes.data?.value || {},
          workProfile: cwp.data?.value || workProfile,
        };
        cacheRef.current = serverSnapshot;
        AsyncStorage.setItem('mt-cache-' + hid, JSON.stringify(serverSnapshot)).catch(() => {});
      } catch (err) {
        console.warn('Erro ao sincronizar com servidor, mantendo dados locais:', err);
      }
    };

    load();

    // Ouvinte em tempo real com controle de repetição
    const debouncedReload = () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => { load(); }, 400);
    };

    const notifyChange = async (payload) => {
      if (!remOn) return;
      try {
        const table = payload.table;
        const n = payload.new || {};
        const author = n.by === uid ? 'Você' : (effectivePartnerName || 'Parceria');

        let title = '';
        let body = '';

        if (table === 'notes' && n.txt) {
          title = 'Bilhete em Nós';
          body = `${author}: ${n.txt}`;
        } else if (table === 'checkin' && n.a) {
          title = 'Check-in em Nós';
          body = `${author} respondeu: ${n.a}`;
        } else if (table === 'config') {
          if (n.key === 'plan') {
            title = 'Combinado em Nós';
            body = n.value?.txt ? `Combinado do casal: ${n.value.txt}` : 'Combinado do casal concluído.';
          } else if (n.key === 'date' && n.value?.t) {
            title = 'Noite do casal em Nós';
            body = `Próxima noite definida para ${DN[n.value.d] || 'o dia'} às ${n.value.t}.`;
          } else if (n.key === 'work_profile') {
            title = 'Agenda atualizada';
            body = 'A rotina familiar e horários foram atualizados.';
          } else if (n.key && n.key.startsWith('day_notes_')) {
            title = 'Agenda atualizada';
            body = 'Um lembrete diário da agenda foi adicionado ou modificado.';
          } else if (n.key === 'partner_slots' || n.key === 'weekend_slots') {
            title = 'Agenda atualizada';
            body = 'Os horários da agenda foram ajustados.';
          }
        } else if (table === 'slots' && n.hour !== undefined) {
          title = 'Agenda atualizada';
          const act = TYPES[n.type]?.n || 'Atividade';
          body = `Horário das ${pad(n.hour)}:00 definido como ${act}.`;
        }

        if (title && body) {
          await notifyInstant(title, body);
        }
      } catch (err) {
        console.warn('Erro ao disparar notificação de mudança:', err);
      }
    };

    const ch = sb.channel('casa-' + hid);
    ['slots', 'tasks', 'care_items', 'care_done', 'pantry', 'menu', 'notes', 'checkin', 'log', 'config'].forEach(table => {
      ch.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${hid}` }, payload => {
        debouncedReload();
        notifyChange(payload);
      });
    });
    ch.subscribe();

    return () => {
      if (reloadTimer.current) clearTimeout(reloadTimer.current);
      sb.removeChannel(ch);
    };
  }, [hid, uid, remOn, effectivePartnerName]);

  // Reagenda notificações com proteção (notifica o que vai acontecer no horário exato)
  useEffect(() => {
    if (!remOn) {
      Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      return;
    }
    if (!care.length && !Object.keys(slots).length) return;

    const list = care.map(it => ({
      time: it.hhmm,
      title: 'Cuidado infantil',
      body: `${it.hhmm} · ${it.label}`,
    }));

    const startH = myProfile?.start ?? 8;
    const endH = myProfile?.end ?? 17;

    for (let h = startH; h < endH; h++) {
      const cur = slots['h' + h], nxt = slots['h' + (h + 1)];
      if (!cur && !nxt) continue;
      const ct = cur?.type || 'foco', nt = nxt?.type || 'foco', cw = cur?.who, nw = nxt?.who;
      if (ct !== nt || cw !== nw) {
        const typeLabel = TYPES[nt]?.n || 'Atividade da rotina';
        const careLabel = nw ? ` · Cuidado com: ${whoOf(nw)}` : '';
        list.push({
          time: `${pad(h + 1)}:00`,
          title: typeLabel,
          body: `${pad(h + 1)}:00 · ${typeLabel}${careLabel}`,
        });
      }
    }

    if (cfgDate?.t) {
      list.push({
        time: cfgDate.t,
        title: 'Noite do casal',
        body: plan?.txt ? `Noite do casal: ${plan.txt}` : 'Horário da noite do casal',
      });
    }

    (async () => {
      try {
        if (await ensurePerm()) await scheduleAll(list);
      } catch (e) {
        console.warn('Lembretes:', e);
      }
    })();
  }, [remOn, care, slots, members, cfgDate, plan, myProfile?.start, myProfile?.end]);

  const cfgSet = async (key, value) => {
    try {
      await sb.from('config').upsert({ household_id: hid, key, value }, { onConflict: 'household_id,key' });
    } catch (_) {}
  };

  const upWeekendSlot = async (hour, patch) => {
    const cur = weekendSlots['h' + hour] || {};
    const updated = { ...weekendSlots, ['h' + hour]: { ...cur, ...patch } };
    setWeekendSlots(updated);
    saveOfflineCache({ weekendSlots: updated });
    await cfgSet('weekend_slots', updated);
    if (patch.type) {
      const act = TYPES[patch.type]?.n || 'Atividade';
      notifyInstant('Agenda atualizada', `Fim de semana às ${pad(hour)}:00: ${act}.`);
    }
  };

  const upDailyNote = async (hour, text) => {
    const updated = { ...dailyNotes, ['h' + hour]: text };
    setDailyNotes(updated);
    saveOfflineCache({ dailyNotes: updated });
    await cfgSet('day_notes_' + todayS(), updated);
    if (text) {
      notifyInstant('Agenda atualizada', `Lembrete das ${pad(hour)}:00: ${text}`);
    }
  };

  const openAlimentar = async (meal = 'almoco') => {
    // 1. Tenta abrir pelo esquema manjar://
    try {
      await Linking.openURL(`manjar://cardapio?refeicao=${meal}&origem=mumu`);
      return;
    } catch {}

    // 2. Tenta abrir pelo esquema legado alimentar://
    try {
      await Linking.openURL(`alimentar://cardapio?refeicao=${meal}&origem=mumu`);
      return;
    } catch {}

    // 3. Fallback no Android: abre o app instalado diretamente pelo pacote
    try {
      const androidPackageIntent =
        'intent:#Intent;package=com.bebealimentar.app;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;end';
      await Linking.openURL(androidPackageIntent);
    } catch {
      Alert.alert(
        'App Manjar',
        'O app Manjar não foi localizado no aparelho. Verifique se ele está instalado.',
        [{ text: 'Entendido' }]
      );
    }
  };

  useEffect(() => {
    const handleMumuUrl = (rawUrl) => {
      if (!rawUrl) return;
      try {
        const isAlmoco = /almoco/i.test(rawUrl);
        const isJantar = /janta/i.test(rawUrl);
        let prato = '';
        const match = /[?&]prato=([^&]+)/.exec(rawUrl);
        if (match) {
          prato = decodeURIComponent(match[1]);
        }

        if (isAlmoco || isJantar) {
          const targetHour = isAlmoco ? 13 : 19;
          const mealTitle = isAlmoco ? 'Almoço' : 'Jantar';
          if (prato) {
            upDailyNote(targetHour, `${mealTitle}: ${prato}`);
            Alert.alert(
              'Cardápio atualizado',
              `O ${mealTitle.toLowerCase()} foi sincronizado a partir do Manjar:\n${prato}`
            );
          }
          setTab('agenda');
        } else if (rawUrl.includes('agenda')) {
          setTab('agenda');
        }
      } catch {}
    };

    Linking.getInitialURL().then(handleMumuUrl);
    const sub = Linking.addEventListener('url', (e) => handleMumuUrl(e.url));
    return () => sub.remove();
  }, [dailyNotes]);

  const upTask = async (id, patch) => {
    // Mantém compatibilidade com ambos os nomes de colunas
    const payload = { ...patch };
    if ('who' in patch && !('assigned_to' in patch)) payload.assigned_to = patch.who;
    if ('assigned_to' in patch && !('who' in patch)) payload.who = patch.assigned_to;
    const nextTasks = tasks.map(t => t.id === id ? { ...t, ...payload } : t);
    setTasks(nextTasks);
    saveOfflineCache({ tasks: nextTasks });
    sb.from('tasks').update(payload).eq('id', id).catch(() => {});
  };

  const logDone = async (key, on) => {
    let nextLogs;
    if (on) {
      const entry = { household_id: hid, key, by: uid, day: todayS() };
      nextLogs = [...logs.filter(x => !(x.key === key && x.day === todayS())), entry];
      setLogs(nextLogs);
      saveOfflineCache({ logs: nextLogs });
      sb.from('log').upsert(entry, { onConflict: 'household_id,key,day' }).catch(() => {});
    } else {
      nextLogs = logs.filter(x => !(x.key === key && x.day === todayS()));
      setLogs(nextLogs);
      saveOfflineCache({ logs: nextLogs });
      sb.from('log').delete().eq('household_id', hid).eq('key', key).eq('day', todayS()).catch(() => {});
    }
  };

  const selfS = () => {
    const s = selfData || {};
    const c = s.day === todayS();
    return {
      items: (s.items?.length ? s.items : DEFAULT_SELF),
      done: c ? (s.done || {}) : {},
      water: c ? (s.water || 0) : 0,
      energy: c ? (s.energy || 0) : 0,
    };
  };

  const saveSelf = async patch => {
    const v = selfS();
    const n = { ...v, ...patch, day: todayS() };
    setSelfData(n);
    await sb.from('config').upsert({ household_id: hid, key: 'self_' + uid, value: n }, { onConflict: 'household_id,key' });
  };

  // Atualização em tempo real das horas e verificação de atualizações automáticas
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function checkAutoUpdates() {
      try {
        if (!__DEV__ && Updates.isEnabled) {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch {}
    }
    checkAutoUpdates();
  }, []);

  const nowH = currentDate.getHours();
  const today = todayS();
  const dayOfWeek = currentDate.getDay();
  const isWeekendToday = dayOfWeek === 0 || dayOfWeek === 6;

  const profiles = resolveProfiles(workProfile, uid, partnerId, myName, partnerName);
  const myProfile = profiles.my;
  const partnerProfile = profiles.partner;

  const saveWorkProfile = async patch => {
    const newMy = {
      mode: patch.myMode ?? myProfile.mode,
      start: patch.myStart ?? myProfile.start,
      end: patch.myEnd ?? myProfile.end,
      arrival: patch.myArrival ?? myProfile.arrival,
    };

    const newPartner = {
      mode: patch.partnerMode ?? partnerProfile.mode,
      start: patch.partnerStart ?? partnerProfile.start,
      end: patch.partnerEnd ?? partnerProfile.end,
      arrival: patch.partnerArrival ?? partnerProfile.arrival,
    };

    const newBedCeline = patch.bedCeline ?? profiles.bedCeline;
    const newBedCasal = patch.bedCasal ?? profiles.bedCasal;
    const newPartnerName = patch.partnerName !== undefined ? patch.partnerName : (workProfile.partnerName || partnerName || '');

    const creatorUid = workProfile.creatorId || (profiles.iAmCreator ? uid : (partnerId || uid));

    const updated = {
      ...workProfile,
      creatorId: creatorUid,
      byUser: {
        ...(workProfile.byUser || {}),
        [uid]: newMy,
        ...(partnerId ? { [partnerId]: newPartner } : {}),
      },
      bedCeline: newBedCeline,
      bedCasal: newBedCasal,
      partnerName: newPartnerName,
      myMode: profiles.iAmCreator ? newMy.mode : newPartner.mode,
      myStart: profiles.iAmCreator ? newMy.start : newPartner.start,
      myEnd: profiles.iAmCreator ? newMy.end : newPartner.end,
      partnerMode: profiles.iAmCreator ? newPartner.mode : newMy.mode,
      partnerStart: profiles.iAmCreator ? newPartner.start : newMy.start,
      partnerEnd: profiles.iAmCreator ? newPartner.end : newMy.end,
      partnerArrival: profiles.iAmCreator ? newPartner.arrival : newMy.arrival,
    };

    setWorkProfile(updated);
    saveOfflineCache({ workProfile: updated });
    await cfgSet('work_profile', updated);
    notifyInstant('Rotina atualizada', 'A rotina familiar foi salva com sucesso.');
  };

  const upMySlot = async (hour, patch) => {
    if (profiles.iAmCreator) {
      const updated = { ...(slots['h' + hour] || {}), ...patch };
      const nextSlots = { ...slots, ['h' + hour]: updated };
      setSlots(nextSlots);
      saveOfflineCache({ slots: nextSlots });
      sb.from('slots').upsert({ household_id: hid, hour, ...patch }, { onConflict: 'household_id,hour' }).catch(() => {});
    } else {
      const cur = partnerSlots['h' + hour] || {};
      const updated = { ...partnerSlots, ['h' + hour]: { ...cur, ...patch } };
      setPartnerSlots(updated);
      saveOfflineCache({ partnerSlots: updated });
      await cfgSet('partner_slots', updated);
    }
    if (patch.type) {
      const act = TYPES[patch.type]?.n || 'Atividade';
      notifyInstant('Agenda atualizada', `${myName}: ${pad(hour)}:00 definido como ${act}.`);
    }
  };

  const upSlot = upMySlot;

  const upPartnerSlot = async (hour, patch) => {
    if (profiles.iAmCreator) {
      const cur = partnerSlots['h' + hour] || {};
      const updated = { ...partnerSlots, ['h' + hour]: { ...cur, ...patch } };
      setPartnerSlots(updated);
      saveOfflineCache({ partnerSlots: updated });
      await cfgSet('partner_slots', updated);
    } else {
      const updated = { ...(slots['h' + hour] || {}), ...patch };
      const nextSlots = { ...slots, ['h' + hour]: updated };
      setSlots(nextSlots);
      saveOfflineCache({ slots: nextSlots });
      sb.from('slots').upsert({ household_id: hid, hour, ...patch }, { onConflict: 'household_id,hour' }).catch(() => {});
    }
    if (patch.type) {
      const act = TYPES[patch.type]?.n || 'Atividade';
      notifyInstant('Agenda atualizada', `${effectivePartnerName}: ${pad(hour)}:00 definido como ${act}.`);
    }
  };

  const slotOf = h => {
    const s = (profiles.iAmCreator ? slots['h' + h] : partnerSlots['h' + h]) || {};
    const myStart = myProfile.start;
    const myEnd = myProfile.end;
    const pArrival = partnerProfile.arrival;
    const bedCeline = profiles.bedCeline;
    const bedCasal = profiles.bedCasal;

    const isCasalBed = h >= bedCasal;
    const isCelineBed = h === bedCeline;
    const isWorkHour = h >= myStart && h < myEnd;
    const isCareWithMe = myProfile.mode === 'casa' && partnerProfile.mode === 'fora' && h >= myStart && h < pArrival;

    let defaultType = 'casa';
    let defaultNote = '';

    if (isCasalBed) {
      defaultType = 'sono';
      defaultNote = 'Hora de dormir do casal';
    } else if (isCelineBed) {
      defaultType = 'filha';
      defaultNote = 'Hora de dormir da criança';
    } else if (h === 13) {
      defaultType = 'pausa';
      defaultNote = 'Almoço em família (13h)';
    } else if (isWorkHour) {
      if (myProfile.mode === 'fora') {
        defaultType = 'foco_fora';
        defaultNote = 'No trabalho fora';
      } else if (myProfile.mode === 'folga') {
        defaultType = 'descanso';
        defaultNote = 'Dia de folga e descanso';
      } else {
        defaultType = 'foco';
        defaultNote = 'Trabalho em casa (foco)';
      }
    }

    const noteText = dailyNotes['h' + h] !== undefined ? dailyNotes['h' + h] : (s.note || '');

    return {
      hour: h,
      type: s.type || defaultType,
      who: s.who !== undefined ? s.who : (isCareWithMe ? uid : (h === pArrival && partnerProfile.mode === 'fora' ? partnerId : null)),
      note: noteText || defaultNote,
    };
  };

  const partnerSlotOf = h => {
    const ps = (profiles.iAmCreator ? partnerSlots['h' + h] : slots['h' + h]) || {};
    const pStart = partnerProfile.start;
    const pEnd = partnerProfile.end;
    const pArrival = partnerProfile.arrival;
    const bedCeline = profiles.bedCeline;
    const bedCasal = profiles.bedCasal;

    const isCasalBed = h >= bedCasal;
    const isCelineBed = h === bedCeline;
    const isWorkHour = h >= pStart && h < pEnd;

    let defaultType = 'casa';
    let defaultNote = '';

    if (isCasalBed) {
      defaultType = 'sono';
      defaultNote = 'Hora de dormir';
    } else if (isCelineBed) {
      defaultType = 'filha';
      defaultNote = 'Ajuda no horário de dormir da criança';
    } else if (h === 13) {
      defaultType = 'pausa';
      defaultNote = 'Horário de almoço (13h)';
    } else if (isWorkHour) {
      if (partnerProfile.mode === 'casa') {
        defaultType = 'foco';
        defaultNote = 'No trabalho em casa';
      } else if (partnerProfile.mode === 'folga') {
        defaultType = 'descanso';
        defaultNote = 'Folga e tempo livre';
      } else {
        defaultType = 'foco_fora';
        defaultNote = 'No trabalho fora';
      }
    } else if (h === pArrival && partnerProfile.mode === 'fora') {
      defaultType = 'filha';
      defaultNote = 'Chegou em casa (assume cuidado infantil)';
    } else if (h > pArrival && h < bedCeline) {
      defaultType = 'casa';
      defaultNote = 'Em família';
    }

    return {
      hour: h,
      type: ps.type || defaultType,
      note: ps.note || defaultNote,
    };
  };

  const weekendSlotOf = h => {
    const ws = weekendSlots['h' + h] || {};
    const isCelineBed = h === (profiles.bedCeline || 20);
    const isCasalBed = h >= (profiles.bedCasal || 22);
    const noteText = dailyNotes['h' + h] !== undefined ? dailyNotes['h' + h] : (ws.note || '');

    let defaultType = 'casa';
    let defaultNote = '';

    if (isCasalBed) {
      defaultType = 'sono';
      defaultNote = 'Hora de dormir do casal';
    } else if (isCelineBed) {
      defaultType = 'filha';
      defaultNote = 'Hora de dormir da criança';
    } else if (h >= 9 && h < 12) {
      defaultType = 'passeio';
      defaultNote = 'Passeio ou lazer em família';
    } else if (h >= 12 && h < 14) {
      defaultType = 'casa';
      defaultNote = 'Almoço juntos';
    } else if (h >= 14 && h < 18) {
      defaultType = 'descanso';
      defaultNote = 'Tempo livre e descanso';
    }

    return {
      hour: h,
      type: ws.type || defaultType,
      who: ws.who !== undefined ? ws.who : null,
      note: noteText || defaultNote,
    };
  };

  const heavyOn = cfgHeavy === today;
  const inviteAccepted = members.length >= 2;

  return (
    <SafeAreaView style={s.screen}>
      {/* CABEÇALHO */}
      <View style={s.headerRow}>
        <TouchableOpacity
          onPress={() => setMenuOpen(true)}
          style={s.burgerBtn}
          activeOpacity={0.7}
        >
          <View style={s.burgerLine} />
          <View style={s.burgerLine} />
          <View style={s.burgerLine} />
        </TouchableOpacity>
        <Image source={require('./assets/logo-symbol.png')} style={{ width: 28, height: 28, resizeMode: 'contain', marginLeft: 10 }} />
        <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
          <Text style={s.h1} numberOfLines={1}>{TAB_NAMES[tab] || home.households.name}</Text>
        </View>

        {IS_PRIVATE_TAB[tab] ? (
          <View style={s.headerPrivatePill}>
            <Text style={s.headerPrivateTxt}>Particular</Text>
          </View>
        ) : (
          !inviteAccepted ? (
            <TouchableOpacity
              style={s.headerInviteBtn}
              onPress={() => Share.share({ message: `Entre no app Mumu com o código: ${home.households.code}` })}
            >
              <Text style={s.headerInviteTxt}>Convidar</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.headerConnectedBadge}>
              <Text style={s.headerConnectedTxt}>
                {effectivePartnerName} e você
              </Text>
            </View>
          )
        )}
      </View>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      {tab === 'agenda' && (
        <TabAgenda
          slots={slots}
          slotOf={slotOf}
          partnerSlots={partnerSlots}
          partnerSlotOf={partnerSlotOf}
          weekendSlots={weekendSlots}
          weekendSlotOf={weekendSlotOf}
          upWeekendSlot={upWeekendSlot}
          upDailyNote={upDailyNote}
          dailyNotes={dailyNotes}
          isWeekendToday={isWeekendToday}
          workProfile={workProfile}
          myProfile={myProfile}
          partnerProfile={partnerProfile}
          bedCeline={profiles.bedCeline}
          bedCasal={profiles.bedCasal}
          saveWorkProfile={saveWorkProfile}
          effectivePartnerName={effectivePartnerName}
          nowH={nowH}
          hid={hid}
          uid={uid}
          myName={myName}
          partnerId={partnerId}
          upSlot={upMySlot}
          upMySlot={upMySlot}
          upPartnerSlot={upPartnerSlot}
          cycleWho={cycleWho}
          whoOf={whoOf}
          cfgSet={cfgSet}
          openAlimentar={openAlimentar}
        />
      )}

      {tab === 'casa' && (
        <TabCasa
          tasks={tasks}
          setTasks={setTasks}
          saveOfflineCache={saveOfflineCache}
          hid={hid}
          uid={uid}
          heavyOn={heavyOn}
          cfgHeavy={cfgHeavy}
          cfgClean={cfgClean}
          upTask={upTask}
          logDone={logDone}
          cycleWho={cycleWho}
          whoOf={whoOf}
          cfgSet={cfgSet}
          today={today}
          openAlimentar={openAlimentar}
          dailyNotes={dailyNotes}
          menu={menu}
        />
      )}

      {tab === 'celine' && (
        <TabCeline
          care={care}
          careDone={careDone}
          setCareDone={setCareDone}
          saveOfflineCache={saveOfflineCache}
          hid={hid}
          uid={uid}
          whoOf={whoOf}
          logDone={logDone}
          openAlimentar={openAlimentar}
          cfgIdeas={cfgIdeas}
          cfgSet={cfgSet}
        />
      )}

      {(tab === 'nos' || tab === 'ideias') && (
        <TabNos
          notes={notes}
          setNotes={setNotes}
          saveOfflineCache={saveOfflineCache}
          cks={cks}
          setCks={setCks}
          logs={logs}
          plan={plan}
          setPlan={setPlan}
          cfgDate={cfgDate}
          hid={hid}
          uid={uid}
          members={members}
          whoOf={whoOf}
          effectivePartnerName={effectivePartnerName}
          cfgSet={cfgSet}
          wkKey={wkKey}
          cfgIdeas={cfgIdeas}
        />
      )}

      {tab === 'trabalho' && (
        <TabTrabalho
          workTasks={workTasks}
          saveWorkTasks={saveWorkTasks}
          dayClosed={dayClosed}
          closeWorkDay={closeWorkDay}
          reopenWorkDay={reopenWorkDay}
          myProfile={myProfile}
          workProfile={workProfile}
          openAlimentar={openAlimentar}
        />
      )}

      {tab === 'eu' && (
        <TabEu
          selfS={selfS}
          saveSelf={saveSelf}
          cfgIdeas={cfgIdeas}
          cfgSet={cfgSet}
        />
      )}

      {tab === 'minhas_notas' && (
        <TabMinhasNotas
          privateNotes={privateNotes}
          savePrivateNotes={savePrivateNotes}
          hid={hid}
          uid={uid}
        />
      )}

      {tab === 'minhas_tarefas' && (
        <TabMinhasTarefas
          privateTasks={privateTasks}
          savePrivateTasks={savePrivateTasks}
          hid={hid}
          uid={uid}
        />
      )}

      {/* MENU LATERAL */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <View style={s.drawerOverlay}>
          <TouchableOpacity style={s.drawerBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <SafeAreaView style={s.drawerContent}>
            <View style={s.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={require('./assets/logo-symbol.png')} style={{ width: 42, height: 42, resizeMode: 'contain' }} />
                <View>
                  <Text style={s.drawerTitle}>Mumu</Text>
                  <Text style={s.sub}>Um + um = nós dois</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setMenuOpen(false)} style={s.drawerCloseBtn}>
                <Text style={s.drawerCloseTxt}>x</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 8 }}>
              {/* SEÇÃO COMPARTILHADA */}
              <View style={s.drawerSection}>
                <Text style={s.drawerSectionTitle}>Nosso espaço (compartilhado)</Text>
              </View>
              {SHARED_ITEMS.map(([k, n, color]) => {
                const active = tab === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[s.drawerItem, active && s.drawerItemActive]}
                    onPress={() => { setTab(k); setMenuOpen(false); }}
                  >
                    <View style={[s.drawerDot, { backgroundColor: color }]} />
                    <Text style={[s.drawerItemTxt, active && s.drawerItemTxtActive]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={s.drawerDivider} />

              {/* SEÇÃO PARTICULAR */}
              <View style={s.drawerSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[s.drawerSectionTitle, { color: '#8E44AD' }]}>Meu espaço (particular)</Text>
                  <View style={s.privateBadge}>
                    <Text style={s.privateBadgeTxt}>Só você</Text>
                  </View>
                </View>
              </View>
              {PRIVATE_ITEMS.map(([k, n, color]) => {
                const active = tab === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[s.drawerItem, active && s.drawerItemActive]}
                    onPress={() => { setTab(k); setMenuOpen(false); }}
                  >
                    <View style={[s.drawerDot, { backgroundColor: color }]} />
                    <Text style={[s.drawerItemTxt, active && s.drawerItemTxtActive]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={s.drawerDivider} />

              {/* STATUS DE CONVITE */}
              {!inviteAccepted ? (
                <TouchableOpacity
                  style={s.drawerCodeBox}
                  onPress={() => Share.share({ message: `Entre no app Mumu com o código: ${home.households.code}` })}
                >
                  <Text style={s.drawerCodeLabel}>Código da casa</Text>
                  <Text style={s.drawerCodeValue}>{home.households.code}</Text>
                  <Text style={s.drawerCodeSub}>Toque para convidar o parceiro</Text>
                </TouchableOpacity>
              ) : (
                <View style={[s.drawerCodeBox, { borderColor: '#C8E6C9', backgroundColor: '#F1F8E9' }]}>
                  <Text style={[s.drawerCodeLabel, { color: '#2E7D32' }]}>Parceria conectada</Text>
                  <Text style={[s.drawerCodeValue, { fontSize: 15, color: '#1B5E20', letterSpacing: 0 }]}>
                    {myName} e {partnerName}
                  </Text>
                  <Text style={[s.drawerCodeSub, { color: '#388E3C' }]}>Tudo sincronizado entre vocês</Text>
                </View>
              )}

              <View style={s.drawerReminderRow}>
                <Text style={[s.sub, { marginBottom: 0, flex: 1 }]}>Lembretes e avisos da rotina</Text>
                <Switch
                  value={remOn}
                  onValueChange={v => { setRemOn(v); AsyncStorage.setItem('mt-rem', v ? '1' : '0'); }}
                  trackColor={{ true: C.accent }}
                />
              </View>
            </ScrollView>

            <View style={s.drawerFooter}>
              <TouchableOpacity
                style={s.drawerLogoutBtn}
                onPress={() => {
                  setMenuOpen(false);
                  Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
                  sb.auth.signOut();
                }}
              >
                <Text style={s.drawerLogoutTxt}>Sair da conta</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── ABA AGENDA ──────────────────────────────────────────────────────────────
function TabAgenda({
  slots, slotOf, partnerSlots, partnerSlotOf, weekendSlots, weekendSlotOf, upWeekendSlot,
  upDailyNote, dailyNotes, isWeekendToday, workProfile, myProfile, partnerProfile, bedCeline, bedCasal,
  saveWorkProfile, effectivePartnerName, nowH, hid, uid, myName, partnerId, upSlot, upMySlot, upPartnerSlot,
  cycleWho, whoOf, cfgSet, openAlimentar
}) {
  const resolvedMyProfile = myProfile || { mode: workProfile?.myMode || 'casa', start: workProfile?.myStart ?? 8, end: workProfile?.myEnd ?? 17, arrival: workProfile?.myEnd ?? 17 };
  const resolvedPartnerProfile = partnerProfile || { mode: workProfile?.partnerMode || 'fora', start: workProfile?.partnerStart ?? 8, end: workProfile?.partnerEnd ?? 16, arrival: workProfile?.partnerArrival ?? 16 };
  const resolvedBedCeline = bedCeline ?? workProfile?.bedCeline ?? 20;
  const resolvedBedCasal = bedCasal ?? workProfile?.bedCasal ?? 22;

  const [mode, setMode] = useState(isWeekendToday ? 'fim_de_semana' : 'dias_uteis');
  const [view, setView] = useState('casal');
  const [configOpen, setConfigOpen] = useState(false);
  const [editingH, setEditingH] = useState(null);
  const [editNote, setEditNote] = useState('');

  const [pName, setPName] = useState(effectivePartnerName || 'Parceiro(a)');
  const [myStartV, setMyStartV] = useState(String(resolvedMyProfile.start));
  const [myEndV, setMyEndV] = useState(String(resolvedMyProfile.end));
  const [pStartV, setPStartV] = useState(String(resolvedPartnerProfile.start));
  const [pEndV, setPEndV] = useState(String(resolvedPartnerProfile.end));
  const [pArrivalV, setPArrivalV] = useState(String(resolvedPartnerProfile.arrival));
  const [bedCelineV, setBedCelineV] = useState(String(resolvedBedCeline));
  const [bedCasalV, setBedCasalV] = useState(String(resolvedBedCasal));

  useEffect(() => {
    setPName(effectivePartnerName || 'Parceiro(a)');
    setMyStartV(String(resolvedMyProfile.start));
    setMyEndV(String(resolvedMyProfile.end));
    setPStartV(String(resolvedPartnerProfile.start));
    setPEndV(String(resolvedPartnerProfile.end));
    setPArrivalV(String(resolvedPartnerProfile.arrival));
    setBedCelineV(String(resolvedBedCeline));
    setBedCasalV(String(resolvedBedCasal));
  }, [resolvedMyProfile.start, resolvedMyProfile.end, resolvedPartnerProfile.start, resolvedPartnerProfile.end, resolvedPartnerProfile.arrival, resolvedBedCeline, resolvedBedCasal, effectivePartnerName]);

  const minH = Math.min(resolvedMyProfile.start, resolvedPartnerProfile.start, 7);
  const maxH = Math.max(resolvedMyProfile.end, resolvedPartnerProfile.end, resolvedBedCasal, 22);
  const hours = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i);

  const isWeekendMode = mode === 'fim_de_semana';
  const isViewingToday = isWeekendMode ? isWeekendToday : !isWeekendToday;
  const myNow = slotOf(nowH);
  const partNow = partnerSlotOf(nowH);

  const myModeLabel = resolvedMyProfile.mode === 'casa' ? 'Em casa' : (resolvedMyProfile.mode === 'fora' ? 'Fora' : 'Folga');
  const partnerModeLabel = resolvedPartnerProfile.mode === 'fora' ? 'Fora' : (resolvedPartnerProfile.mode === 'casa' ? 'Em casa' : 'Folga');

  const openSlotEdit = h => {
    const curNote = isWeekendMode ? weekendSlotOf(h).note : slotOf(h).note;
    setEditNote(curNote || '');
    setEditingH(h);
  };

  const saveAndCloseEdit = () => {
    if (editingH !== null) {
      upDailyNote(editingH, editNote);
      setEditingH(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* BARRA SUPERIOR: MODO E AJUSTAR ROTINA */}
      <View style={s.agendaTopBar}>
        <View style={s.segmentedControl}>
          <TouchableOpacity
            style={[s.segmentedBtn, !isWeekendMode && s.segmentedBtnActive]}
            onPress={() => setMode('dias_uteis')}
            activeOpacity={0.8}
          >
            <Text style={[s.segmentedTxt, !isWeekendMode && s.segmentedTxtActive]}>Dias úteis</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.segmentedBtn, isWeekendMode && s.segmentedBtnActive]}
            onPress={() => setMode('fim_de_semana')}
            activeOpacity={0.8}
          >
            <Text style={[s.segmentedTxt, isWeekendMode && s.segmentedTxtActive]}>Fim de semana</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.settingsBtn}
          onPress={() => setConfigOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={s.settingsBtnTxt}>Ajustar rotina</Text>
        </TouchableOpacity>
      </View>

      {/* CARD DO MOMENTO ATUAL (AGORA) - EXIBIDO APENAS SE A ABA FOR A DE HOJE */}
      {isViewingToday && (
        <View style={s.nowCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={s.nowTitle}>Agora ({pad(nowH)}:00)</Text>
            <View style={s.nowBadge}>
              <Text style={s.nowBadgeTxt}>{isWeekendMode ? 'Fim de semana' : 'Dia útil'}</Text>
            </View>
          </View>

          {!isWeekendMode ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[s.nowPersonBox, { borderColor: '#E0E7FF', backgroundColor: '#F8FAFF' }]}>
                <Text style={[s.nowPersonLabel, { color: C.foco }]}>{myName} · {myModeLabel}</Text>
                <Text style={s.nowActivityTxt}>{TYPES[myNow.type]?.n}</Text>
                {myNow.who ? <Text style={s.nowSubTxt}>Cuidado: {whoOf(myNow.who)}</Text> : null}
              </View>
              <View style={[s.nowPersonBox, { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }]}>
                <Text style={[s.nowPersonLabel, { color: '#1E3A8A' }]}>{pName} · {partnerModeLabel}</Text>
                <Text style={s.nowActivityTxt}>{TYPES[partNow.type]?.n}</Text>
                {partNow.note ? <Text style={s.nowSubTxt}>{partNow.note}</Text> : null}
              </View>
            </View>
          ) : (
            <View style={[s.nowPersonBox, { borderColor: '#E8F5E9', backgroundColor: '#F4FBF7' }]}>
              <Text style={s.nowActivityTxt}>{TYPES[weekendSlotOf(nowH).type]?.n}</Text>
              <Text style={s.nowSubTxt}>{weekendSlotOf(nowH).note || 'Momento em família e descanso'}</Text>
            </View>
          )}

          {(nowH === 12 || nowH === 13 || nowH === 18 || nowH === 19 || nowH === 20) && (
            <TouchableOpacity
              style={s.agendaAlimentarBtn}
              onPress={() => openAlimentar && openAlimentar(nowH >= 17 ? 'jantar' : 'almoco')}
              activeOpacity={0.8}
            >
              <Text style={s.agendaAlimentarBtnTxt}>
                {nowH >= 17 ? 'Ver cardápio do jantar no Manjar' : 'Ver cardápio do almoço no Manjar'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* SELETOR DE VISÃO (NOS DIAS ÚTEIS) */}
      {!isWeekendMode && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[
            ['casal', 'Nós dois'],
            ['eu', `${myName}`],
            ['parceiro', `${pName}`]
          ].map(([v, label]) => (
            <TouchableOpacity
              key={v}
              style={[s.filterPill, view === v && s.filterPillActive]}
              onPress={() => setView(v)}
              activeOpacity={0.7}
            >
              <Text style={[s.filterPillTxt, view === v && s.filterPillTxtActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* LISTAGEM DE HORÁRIOS LIMPA E COMPACTA */}
      {hours.map(h => {
        const isCelineBed = h === (resolvedBedCeline ?? 20);
        const isCasalBed = h >= (resolvedBedCasal ?? 22);
        const isCurrent = isViewingToday && h === nowH;

        if (isWeekendMode) {
          const wSlot = weekendSlotOf(h);
          const wType = TYPES[wSlot.type] || TYPES.casa;
          const isLunchW = (h >= 12 && h < 14) || /almo[çc]o/i.test(wSlot.note || '');
          const isDinnerW = (h >= 18 && h <= 20) || /janta/i.test(wSlot.note || '');

          return (
            <TouchableOpacity
              key={h}
              style={[s.slotRow, isCurrent && s.slotRowCurrent]}
              onPress={() => {
                if (isLunchW) {
                  openAlimentar && openAlimentar('almoco');
                } else if (isDinnerW) {
                  openAlimentar && openAlimentar('jantar');
                } else {
                  openSlotEdit(h);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={s.slotTimeCol}>
                <Text style={[s.slotHourTxt, isCurrent && s.slotHourTxtCurrent]}>{pad(h)}:00</Text>
                {isCurrent && <View style={s.slotActiveDot} />}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                  <View style={[s.badgePill, { backgroundColor: wType.c + '18' }]}>
                    <View style={[s.badgeDot, { backgroundColor: wType.c }]} />
                    <Text style={[s.badgePillTxt, { color: wType.c }]}>{wType.n}</Text>
                  </View>

                  {isLunchW && (
                    <TouchableOpacity
                      style={s.slotMealPill}
                      onPress={(e) => { e.stopPropagation(); openAlimentar && openAlimentar('almoco'); }}
                    >
                      <Text style={s.slotMealPillTxt}>Almoço no Manjar ›</Text>
                    </TouchableOpacity>
                  )}
                  {isDinnerW && (
                    <TouchableOpacity
                      style={s.slotMealPill}
                      onPress={(e) => { e.stopPropagation(); openAlimentar && openAlimentar('jantar'); }}
                    >
                      <Text style={s.slotMealPillTxt}>Jantar no Manjar ›</Text>
                    </TouchableOpacity>
                  )}

                  {isCelineBed && (
                    <View style={[s.badgePill, { backgroundColor: '#FDE8E8' }]}>
                      <Text style={[s.badgePillTxt, { color: '#C2517A' }]}>Dormir da criança</Text>
                    </View>
                  )}
                  {isCasalBed && (
                    <View style={[s.badgePill, { backgroundColor: '#EDE9FE' }]}>
                      <Text style={[s.badgePillTxt, { color: '#5B4D9E' }]}>Dormir do casal</Text>
                    </View>
                  )}
                </View>

                {!!wSlot.note && (
                  <Text style={s.slotNoteTxt}>{wSlot.note}</Text>
                )}
              </View>

              <Text style={s.slotChevron}>›</Text>
            </TouchableOpacity>
          );
        }

        const mySlot = slotOf(h);
        const myT = TYPES[mySlot.type] || TYPES.foco;
        const pSlot = partnerSlotOf(h);
        const pT = TYPES[pSlot.type] || TYPES.foco_fora;
        const isLunchD = h === 13 || /almo[çc]o/i.test(mySlot.note || '') || /almo[çc]o/i.test(pSlot.note || '');
        const isDinnerD = (h >= 18 && h <= 20) || /janta/i.test(mySlot.note || '') || /janta/i.test(pSlot.note || '');
        const slotNote = (dailyNotes && dailyNotes['h' + h]) || (view === 'parceiro' ? pSlot.note : mySlot.note);

        return (
          <TouchableOpacity
            key={h}
            style={[s.slotRow, isCurrent && s.slotRowCurrent]}
            onPress={() => {
              if (isLunchD) {
                openAlimentar && openAlimentar('almoco');
              } else if (isDinnerD) {
                openAlimentar && openAlimentar('jantar');
              } else {
                openSlotEdit(h);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={s.slotTimeCol}>
              <Text style={[s.slotHourTxt, isCurrent && s.slotHourTxtCurrent]}>{pad(h)}:00</Text>
              {isCurrent && <View style={s.slotActiveDot} />}
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                {(view === 'casal' || view === 'eu') && (
                  <View style={[s.badgePill, { backgroundColor: myT.c + '18' }]}>
                    <View style={[s.badgeDot, { backgroundColor: myT.c }]} />
                    <Text style={[s.badgePillTxt, { color: myT.c }]}>
                      {view === 'casal' ? `${myName}: ${myT.n}` : myT.n}
                    </Text>
                  </View>
                )}

                {mySlot.who && (
                  <View style={[s.badgePill, { backgroundColor: '#FDF2F4' }]}>
                    <Text style={[s.badgePillTxt, { color: C.filha }]}>Cuidado: {whoOf(mySlot.who)}</Text>
                  </View>
                )}

                {(view === 'casal' || view === 'parceiro') && (
                  <View style={[s.badgePill, { backgroundColor: pT.c + '18' }]}>
                    <View style={[s.badgeDot, { backgroundColor: pT.c }]} />
                    <Text style={[s.badgePillTxt, { color: pT.c }]}>
                      {view === 'casal' ? `${pName}: ${pT.n}` : pT.n}
                    </Text>
                  </View>
                )}

                {isLunchD && (
                  <TouchableOpacity
                    style={s.slotMealPill}
                    onPress={(e) => { e.stopPropagation(); openAlimentar && openAlimentar('almoco'); }}
                  >
                    <Text style={s.slotMealPillTxt}>Almoço no Manjar ›</Text>
                  </TouchableOpacity>
                )}
                {isDinnerD && (
                  <TouchableOpacity
                    style={s.slotMealPill}
                    onPress={(e) => { e.stopPropagation(); openAlimentar && openAlimentar('jantar'); }}
                  >
                    <Text style={s.slotMealPillTxt}>Jantar no Manjar ›</Text>
                  </TouchableOpacity>
                )}

                {isCelineBed && (
                  <View style={[s.badgePill, { backgroundColor: '#FDE8E8' }]}>
                    <Text style={[s.badgePillTxt, { color: '#C2517A' }]}>Dormir criança</Text>
                  </View>
                )}
                {isCasalBed && (
                  <View style={[s.badgePill, { backgroundColor: '#EDE9FE' }]}>
                    <Text style={[s.badgePillTxt, { color: '#5B4D9E' }]}>Dormir casal</Text>
                  </View>
                )}
              </View>

              {!!slotNote && (
                <Text style={s.slotNoteTxt}>{slotNote}</Text>
              )}
            </View>

            <Text style={s.slotChevron}>›</Text>
          </TouchableOpacity>
        );
      })}

      {/* MODAL PARA EDITAR UM HORÁRIO ESPECÍFICO */}
      <Modal visible={editingH !== null} transparent animationType="fade" onRequestClose={() => setEditingH(null)}>
        <View style={s.modalBackdrop}>
          <TouchableOpacity style={s.modalBackdropTouch} activeOpacity={1} onPress={() => setEditingH(null)} />
          <View style={s.modalSheet}>
            <View style={s.modalSheetHeader}>
              <Text style={s.modalSheetTitle}>Horário das {editingH !== null ? pad(editingH) : ''}:00</Text>
              <TouchableOpacity onPress={() => setEditingH(null)} style={s.modalCloseBtn}>
                <Text style={s.modalCloseTxt}>x</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {!isWeekendMode ? (
                <>
                  <Text style={s.modalSectionLabel}>Atividade de {myName}:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {TK.map(k => (
                      <TouchableOpacity
                        key={k}
                        style={[s.chipLine, slotOf(editingH || 8).type === k && { backgroundColor: TYPES[k].c, borderColor: TYPES[k].c }]}
                        onPress={() => (upMySlot || upSlot)(editingH, { type: k })}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: slotOf(editingH || 8).type === k ? '#fff' : C.ink }}>
                          {TYPES[k].n}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.modalSectionLabel}>Atividade de {pName}:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {TK.map(k => (
                      <TouchableOpacity
                        key={k}
                        style={[s.chipLine, partnerSlotOf(editingH || 8).type === k && { backgroundColor: TYPES[k].c, borderColor: TYPES[k].c }]}
                        onPress={() => upPartnerSlot(editingH, { type: k })}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: partnerSlotOf(editingH || 8).type === k ? '#fff' : C.ink }}>
                          {TYPES[k].n}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.modalSectionLabel}>Com quem fica o cuidado da criança?</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {[
                      [null, 'Ninguém / Creche'],
                      [uid, myName],
                      [partnerId, pName || 'Parceiro(a)'],
                    ].map(([idVal, lbl]) => (
                      <TouchableOpacity
                        key={String(idVal)}
                        style={[s.chipLine, slotOf(editingH || 8).who === idVal && { backgroundColor: C.filha, borderColor: C.filha }]}
                        onPress={() => (upMySlot || upSlot)(editingH, { who: idVal })}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: slotOf(editingH || 8).who === idVal ? '#fff' : C.ink }}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={s.modalSectionLabel}>Atividade em família:</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {TK.map(k => (
                      <TouchableOpacity
                        key={k}
                        style={[s.chipLine, weekendSlotOf(editingH || 8).type === k && { backgroundColor: TYPES[k].c, borderColor: TYPES[k].c }]}
                        onPress={() => upWeekendSlot(editingH, { type: k })}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: weekendSlotOf(editingH || 8).type === k ? '#fff' : C.ink }}>
                          {TYPES[k].n}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={s.modalSectionLabel}>Lembrete deste horário para hoje:</Text>
              <TextInput
                style={[s.inp, { marginBottom: 16 }]}
                placeholder="Ex: Reunião com equipe, pediatra..."
                value={editNote}
                onChangeText={setEditNote}
              />
            </ScrollView>

            {(editingH === 12 || editingH === 13 || editingH === 18 || editingH === 19 || editingH === 20 || /almo[çc]o/i.test(editNote) || /janta/i.test(editNote)) && (
              <TouchableOpacity
                style={s.modalMealBtn}
                onPress={() => {
                  const meal = (editingH >= 17 || /janta/i.test(editNote)) ? 'jantar' : 'almoco';
                  setEditingH(null);
                  openAlimentar && openAlimentar(meal);
                }}
              >
                <Text style={s.modalMealBtnTxt}>
                  {(editingH >= 17 || /janta/i.test(editNote)) ? 'Abrir jantar no app Manjar' : 'Abrir almoço no app Manjar'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={s.btn} onPress={saveAndCloseEdit}>
              <Text style={s.btnT}>Concluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIGURAÇÃO DE ROTINA */}
      <Modal visible={configOpen} animationType="slide" onRequestClose={() => setConfigOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={s.modalFullscreenHeader}>
            <Text style={s.modalFullscreenTitle}>Configuração de rotina</Text>
            <TouchableOpacity onPress={() => setConfigOpen(false)} style={s.modalFullscreenClose}>
              <Text style={s.modalFullscreenCloseTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
            {/* SUA CONFIGURAÇÃO */}
            <View style={s.configSection}>
              <Text style={[s.modalSectionLabel, { color: C.foco }]}>Sua rotina ({myName})</Text>
              <Text style={[s.sub, { marginBottom: 8 }]}>Onde você trabalha nos dias úteis:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[
                  ['casa', 'Trabalho em casa'],
                  ['fora', 'Trabalho fora'],
                  ['folga', 'Folga / Livre'],
                ].map(([m, lbl]) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.chipLine, (resolvedMyProfile.mode || 'casa') === m && { backgroundColor: C.foco, borderColor: C.foco }]}
                    onPress={() => saveWorkProfile({ myMode: m })}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: (resolvedMyProfile.mode || 'casa') === m ? '#fff' : C.ink }}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={[s.sub, { marginBottom: 0 }]}>Horário:</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={myStartV}
                  onChangeText={setMyStartV}
                  onEndEditing={() => {
                    const v = parseInt(myStartV);
                    if (!isNaN(v)) saveWorkProfile({ myStart: v });
                  }}
                />
                <Text style={s.sub}>às</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={myEndV}
                  onChangeText={setMyEndV}
                  onEndEditing={() => {
                    const v = parseInt(myEndV);
                    if (!isNaN(v)) saveWorkProfile({ myEnd: v });
                  }}
                />
                <Text style={s.sub}>h</Text>
              </View>
            </View>

            {/* CONFIGURAÇÃO DA PARCERIA */}
            <View style={s.configSection}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={[s.modalSectionLabel, { color: '#1E3A8A', marginBottom: 0 }]}>Parceria ({pName}):</Text>
                <TextInput
                  style={[s.inp, { flex: 1, marginBottom: 0, paddingVertical: 6, paddingHorizontal: 10, fontSize: 13, fontWeight: '700' }]}
                  placeholder="Nome da parceria (opcional)"
                  value={pName}
                  onChangeText={setPName}
                  onEndEditing={e => {
                    const val = e.nativeEvent.text.trim();
                    if (val) saveWorkProfile({ partnerName: val });
                  }}
                />
              </View>

              <Text style={[s.sub, { marginBottom: 8 }]}>Onde a parceria trabalha:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                {[
                  ['fora', 'Trabalho fora'],
                  ['casa', 'Trabalho em casa'],
                  ['folga', 'Folga / Livre'],
                ].map(([m, lbl]) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.chipLine, (resolvedPartnerProfile.mode || 'fora') === m && { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }]}
                    onPress={() => saveWorkProfile({ partnerMode: m })}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: (resolvedPartnerProfile.mode || 'fora') === m ? '#fff' : C.ink }}>
                      {lbl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                <Text style={[s.sub, { marginBottom: 0 }]}>Horário:</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={pStartV}
                  onChangeText={setPStartV}
                  onEndEditing={() => {
                    const v = parseInt(pStartV);
                    if (!isNaN(v)) saveWorkProfile({ partnerStart: v });
                  }}
                />
                <Text style={s.sub}>às</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={pEndV}
                  onChangeText={setPEndV}
                  onEndEditing={() => {
                    const v = parseInt(pEndV);
                    if (!isNaN(v)) saveWorkProfile({ partnerEnd: v });
                  }}
                />
                <Text style={s.sub}>h</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={[s.sub, { marginBottom: 0 }]}>Chega em casa (assume cuidado infantil):</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={pArrivalV}
                  onChangeText={setPArrivalV}
                  onEndEditing={() => {
                    const v = parseInt(pArrivalV);
                    if (!isNaN(v)) saveWorkProfile({ partnerArrival: v });
                  }}
                />
                <Text style={s.sub}>h</Text>
              </View>
            </View>

            {/* HORÁRIOS DE DORMIR */}
            <View style={s.configSection}>
              <Text style={[s.modalSectionLabel, { color: C.filha }]}>Horários de dormir</Text>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                <Text style={[s.sub, { width: 140, marginBottom: 0 }]}>Dormir da criança:</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={bedCelineV}
                  onChangeText={setBedCelineV}
                  onEndEditing={() => {
                    const v = parseInt(bedCelineV);
                    if (!isNaN(v)) saveWorkProfile({ bedCeline: v });
                  }}
                />
                <Text style={s.sub}>h</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Text style={[s.sub, { width: 140, marginBottom: 0 }]}>Dormir do casal:</Text>
                <TextInput
                  style={[s.inp, { width: 50, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
                  keyboardType="numeric"
                  value={bedCasalV}
                  onChangeText={setBedCasalV}
                  onEndEditing={() => {
                    const v = parseInt(bedCasalV);
                    if (!isNaN(v)) saveWorkProfile({ bedCasal: v });
                  }}
                />
                <Text style={s.sub}>h</Text>
              </View>
            </View>

            <TouchableOpacity style={s.btn} onPress={() => setConfigOpen(false)}>
              <Text style={s.btnT}>Salvar e voltar para a agenda</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ─── ABA CASA ─────────────────────────────────────────────────────────────────
function TabCasa({
  tasks, setTasks, saveOfflineCache, hid, uid, heavyOn, cfgHeavy, cfgClean, upTask, logDone,
  cycleWho, whoOf, cfgSet, today, openAlimentar, dailyNotes, menu
}) {
  const [tt, setTt] = useState('');
  const [tm, setTm] = useState('');
  const todayDayIdx = new Date().getDay();
  const [selectedMealDay, setSelectedMealDay] = useState(todayDayIdx);
  const [selectedDivisionId, setSelectedDivisionId] = useState(null);
  const [roomDone, setRoomDone] = useState(false);

  const selectedMealDayName = DN[selectedMealDay] || 'Segunda';

  // Obtém o cardápio do dia segundo o Manjar
  const getMealForDay = (mealType, dayIdx, dayName) => {
    const isToday = dayIdx === todayDayIdx;
    if (isToday && dailyNotes) {
      const noteKey = mealType === 'almoco' ? 'h13' : 'h19';
      if (dailyNotes[noteKey]) {
        return dailyNotes[noteKey].replace(/^(Almoço|Jantar):\s*/i, '');
      }
    }
    if (menu && menu[dayIdx]) {
      const menuDish = mealType === 'almoco' ? menu[dayIdx].dish : (menu[dayIdx].dinner || menu[dayIdx].dish);
      if (menuDish) return menuDish;
    }
    return MANJAR_WEEKLY_MENU[dayName]?.[mealType] || 'Consulte o cardápio no app Manjar';
  };

  const currentAlmoco = getMealForDay('almoco', selectedMealDay, selectedMealDayName);
  const currentJantar = getMealForDay('jantar', selectedMealDay, selectedMealDayName);

  // Foco do cômodo de hoje (divisão da casa correspondente ao dia)
  const todayDivision = HOUSE_DIVISIONS.find(d => d.dayIdx === todayDayIdx) || HOUSE_DIVISIONS[0];
  const activeDivision = selectedDivisionId
    ? (HOUSE_DIVISIONS.find(d => d.id === selectedDivisionId) || todayDivision)
    : todayDivision;

  const clean = (Array.isArray(cfgClean) && cfgClean[todayDayIdx]) || DEFAULT_CLEAN[todayDayIdx] || DEFAULT_CLEAN[0] || ['Arrumação rápida', 15];
  const left = tasks.filter(t => t.done_date !== today && (!heavyOn || (t.minutes || 0) <= 10)).reduce((a, t) => a + (t.minutes || 0), 0);

  const addTask = async () => {
    if (!tt.trim()) return;
    const minutes = parseInt(tm) || 10;
    const newTask = {
      id: 'task_' + Date.now(),
      household_id: hid,
      title: tt.trim(),
      minutes,
      who: null,
      assigned_to: null,
      done_date: null,
      created_at: new Date().toISOString()
    };
    if (setTasks) {
      setTasks(prev => {
        const next = [...prev, newTask];
        if (saveOfflineCache) saveOfflineCache({ tasks: next });
        return next;
      });
    }
    sb.from('tasks').insert(newTask).catch(() => {});
    setTt('');
    setTm('');
  };

  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* SEÇÃO CARDÁPIO SEGUNDO O APP MANJAR */}
      <View style={s.mealSectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={s.mealSectionTitle}>Cardápio do Manjar</Text>
          <Text style={s.mealSectionBadge}>
            {selectedMealDay === todayDayIdx ? 'Hoje' : selectedMealDayName}
          </Text>
        </View>

        <Text style={s.mealSectionDesc}>
          O que vai ser cozinhado segundo o planeamento do app Manjar.
        </Text>

        {/* SELETOR DE DIAS DA SEMANA PARA O CARDÁPIO */}
        <View style={s.mealDayRow}>
          {DN.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[s.mealDayChip, selectedMealDay === i && s.mealDayChipActive]}
              onPress={() => setSelectedMealDay(i)}
            >
              <Text style={[s.mealDayChipTxt, selectedMealDay === i && s.mealDayChipTxtActive]}>
                {d.slice(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PRATOS PLANEJADOS */}
        <View style={s.mealDishRow}>
          <View style={s.mealDishBox}>
            <Text style={s.mealDishType}>Almoço</Text>
            <Text style={s.mealDishName}>{currentAlmoco}</Text>
          </View>
          <View style={s.mealDishBox}>
            <Text style={s.mealDishType}>Jantar</Text>
            <Text style={s.mealDishName}>{currentJantar}</Text>
          </View>
        </View>

        {/* ATALHOS PARA O APP MANJAR */}
        <View style={s.alimentarBtnRow}>
          <TouchableOpacity
            style={s.alimentarQuickBtn}
            onPress={() => openAlimentar && openAlimentar('almoco')}
          >
            <Text style={s.alimentarQuickBtnTxt}>Abrir almoço no Manjar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.alimentarQuickBtn}
            onPress={() => openAlimentar && openAlimentar('jantar')}
          >
            <Text style={s.alimentarQuickBtnTxt}>Abrir jantar no Manjar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.alimentarQuickBtn, { backgroundColor: '#1B5E20' }]}
            onPress={() => openAlimentar && openAlimentar('despensa')}
          >
            <Text style={s.alimentarQuickBtnTxt}>Despensa e compras</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SEÇÃO ARRUMAÇÃO DA CASA SEM SOBRECARGA */}
      <View style={{ marginTop: 10, marginBottom: 12 }}>
        <Text style={s.h2}>Arrumação da casa sem sobrecarga</Text>
        <Text style={s.sub}>
          2 quartos, cozinha, sala, corredor, casa de banho e varanda organizados com 15 a 20 minutos por dia.
        </Text>
      </View>

      {/* BOTÃO MODO LEVE */}
      <TouchableOpacity
        style={[s.chipLine, { marginBottom: 10, alignSelf: 'flex-start' }]}
        onPress={() => cfgSet('heavy', { day: heavyOn ? '' : today })}
      >
        <Text style={{ fontWeight: '700', color: heavyOn ? C.casa : C.ink }}>
          {heavyOn ? 'Voltar à rotina normal' : 'Hoje está pesado (Modo leve)'}
        </Text>
      </TouchableOpacity>

      {/* CARD DO FOCO DE HOJE */}
      <View style={[s.roomFocusCard, heavyOn && { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[s.roomFocusTitle, heavyOn && { color: '#0369A1' }]}>
            {heavyOn ? 'Modo leve: apenas o essencial' : `Foco de hoje: ${todayDivision.name}`}
          </Text>
          <View style={s.roomMinutesBadge}>
            <Text style={s.roomMinutesTxt}>{heavyOn ? '10 min' : `${todayDivision.min} min`}</Text>
          </View>
        </View>

        <Text style={[s.roomFocusDesc, heavyOn && { color: '#075985' }]}>
          {heavyOn
            ? 'Apenas manter pias livres, recolher itens soltos e arejar a casa. O restante espera amanhã.'
            : todayDivision.task}
        </Text>

        {!heavyOn && todayDivision.checklist && (
          <View style={{ marginTop: 6, marginBottom: 10 }}>
            {todayDivision.checklist.map((item, idx) => (
              <View key={idx} style={s.roomCheckItem}>
                <Text style={s.roomCheckBullet}>•</Text>
                <Text style={s.roomCheckText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, { marginBottom: 0, marginTop: 4, backgroundColor: roomDone ? '#15803D' : C.casa }]}
          onPress={() => {
            const nextDone = !roomDone;
            setRoomDone(nextDone);
            logDone('clean_' + todayDivision.id, nextDone);
          }}
        >
          <Text style={s.btnT}>
            {roomDone ? 'Arrumação de hoje concluída' : 'Marcar foco de hoje como feito'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* GUIA DAS 6 DIVISÕES DA CASA */}
      <Text style={[s.sub, { marginTop: 8, fontWeight: '700', color: C.ink }]}>
        Escala semanal por divisão da casa
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {HOUSE_DIVISIONS.map(div => {
            const isToday = div.dayIdx === todayDayIdx;
            const isSelected = activeDivision.id === div.id;
            return (
              <TouchableOpacity
                key={div.id}
                style={[
                  s.divisionChip,
                  isSelected && s.divisionChipSelected,
                  isToday && !isSelected && s.divisionChipToday
                ]}
                onPress={() => setSelectedDivisionId(div.id === selectedDivisionId ? null : div.id)}
              >
                <Text style={[s.divisionChipDay, (isSelected || isToday) && { fontWeight: '800' }]}>
                  {div.day}
                </Text>
                <Text style={[s.divisionChipName, isSelected && { color: '#FFFFFF' }]}>
                  {div.name}
                </Text>
                <Text style={[s.divisionChipMin, isSelected && { color: '#E2E8F0' }]}>
                  {div.min} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* DETALHE DO CÔMODO SELECIONADO NA ESCALA */}
      {selectedDivisionId && activeDivision.id !== todayDivision.id && (
        <Card style={{ marginBottom: 12 }}>
          <Text style={{ fontWeight: '800', fontSize: 14, color: C.ink, marginBottom: 4 }}>
            {activeDivision.name} · {activeDivision.day} ({activeDivision.min} min)
          </Text>
          <Text style={[s.sub, { marginBottom: 6 }]}>{activeDivision.task}</Text>
          {activeDivision.checklist?.map((it, idx) => (
            <View key={idx} style={s.roomCheckItem}>
              <Text style={s.roomCheckBullet}>•</Text>
              <Text style={s.roomCheckText}>{it}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* REGRAS RÁPIDAS DIÁRIAS (SEM SOBRECARGA) */}
      <Card style={{ marginBottom: 14 }}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: C.ink, marginBottom: 4 }}>
          Manutenção diária de 10 minutos
        </Text>
        <Text style={s.sub}>Três hábitos simples para evitar acúmulo nos cômodos:</Text>
        <View style={{ marginTop: 4 }}>
          <Text style={s.roomCheckText}>1. Cozinha: pia desimpedida e bancadas passadas a pano</Text>
          <Text style={s.roomCheckText}>2. Sala e corredor: recolher calçados, bolsas e brinquedos</Text>
          <Text style={s.roomCheckText}>3. Dois quartos: arejar janelas pela manhã e esticar as camas</Text>
        </View>
      </Card>

      {/* TAREFAS ADICIONAIS DA CASA */}
      <Text style={[s.h2, { marginTop: 4 }]}>Tarefas compartilhadas da casa</Text>
      <Card>
        <Text style={{ fontWeight: '800' }}>
          {tasks.filter(t => t.done_date === today).length} de {tasks.length} feitas. Faltam {left} min.
        </Text>
      </Card>

      {tasks.map(t => {
        const dn = t.done_date === today;
        const currentWho = t.assigned_to || t.who;
        if (heavyOn && !dn && (t.minutes || 0) > 10) return null;
        return (
          <View key={t.id} style={s.taskRow}>
            <TouchableOpacity onPress={() => { upTask(t.id, { done_date: dn ? null : today }); logDone('t' + t.id, !dn); }}>
              <Text style={{ fontSize: 26 }}>{dn ? 'v' : 'o'}</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <TextInput
                style={[{ fontSize: 16 }, dn && { textDecorationLine: 'line-through', color: C.mute }]}
                defaultValue={t.title}
                onEndEditing={e => e.nativeEvent.text.trim() && upTask(t.id, { title: e.nativeEvent.text.trim() })}
              />
              <TextInput
                style={{ color: C.mute, fontSize: 13 }}
                keyboardType="numeric"
                defaultValue={String(t.minutes || 10)}
                onEndEditing={e => upTask(t.id, { minutes: parseInt(e.nativeEvent.text) || 10 })}
              />
            </View>
            <TouchableOpacity style={s.chipLine} onPress={() => upTask(t.id, { who: cycleWho(currentWho), assigned_to: cycleWho(currentWho) })}>
              <Text style={{ fontWeight: '700', fontSize: 12 }}>{currentWho ? whoOf(currentWho) : 'De quem?'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onLongPress={() => Alert.alert('Apagar?', t.title, [{ text: 'Cancelar' }, { text: 'Apagar', style: 'destructive', onPress: () => {
              if (setTasks) {
                setTasks(prev => {
                  const next = prev.filter(x => x.id !== t.id);
                  if (saveOfflineCache) saveOfflineCache({ tasks: next });
                  return next;
                });
              }
              sb.from('tasks').delete().eq('id', t.id).catch(() => {});
            } }])}>
              <Text style={{ color: C.mute, fontSize: 22, padding: 4 }}>x</Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput style={[s.inp, { flex: 1, marginBottom: 0 }]} placeholder="Nova tarefa da casa" value={tt} onChangeText={setTt} />
        <TextInput style={[s.inp, { width: 60, marginBottom: 0 }]} placeholder="min" keyboardType="numeric" value={tm} onChangeText={setTm} />
        <TouchableOpacity style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]} onPress={addTask}>
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── ABA TRABALHO E FOCO (DEV) ────────────────────────────────────────────────
function TabTrabalho({ workTasks, saveWorkTasks, dayClosed, closeWorkDay, reopenWorkDay, myProfile, workProfile, openAlimentar }) {
  const [filter, setFilter] = useState('all');
  const [txt, setTxt] = useState('');
  const [prio, setPrio] = useState('P1');
  const [tag, setTag] = useState('Feature');
  const [est, setEst] = useState('30');
  const [showAdd, setShowAdd] = useState(false);

  const [timer, setTimer] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [pm, setPm] = useState(25);
  const ivRef = useRef(null);

  const startStop = () => {
    if (running) {
      clearInterval(ivRef.current);
      setRunning(false);
    } else {
      const e = Date.now() + timer * 1000;
      ivRef.current = setInterval(() => {
        const l = Math.round((e - Date.now()) / 1000);
        setTimer(Math.max(0, l));
        if (l <= 0) {
          clearInterval(ivRef.current);
          setRunning(false);
        }
      }, 500);
      setRunning(true);
    }
  };

  useEffect(() => () => clearInterval(ivRef.current), []);

  const add = () => {
    if (!txt.trim()) return;
    const newTask = {
      id: 'wt_' + Date.now(),
      txt: txt.trim(),
      prio,
      tag,
      est: parseInt(est) || 30,
      done: false,
      date: todayS(),
    };
    saveWorkTasks([newTask, ...(workTasks || [])]);
    setTxt('');
    setShowAdd(false);
  };

  const toggle = id => {
    const list = (workTasks || []).map(t => t.id === id ? { ...t, done: !t.done } : t);
    saveWorkTasks(list);
  };

  const del = id => {
    saveWorkTasks((workTasks || []).filter(t => t.id !== id));
  };

  const p1Items = (workTasks || []).filter(t => t.prio === 'P1');
  const p1Done = p1Items.filter(t => t.done).length;
  const p1Total = p1Items.length;

  const PRIO_COLORS = {
    P1: '#D32F2F',
    P2: '#1976D2',
    P3: '#689F38',
  };

  const TAG_COLORS = {
    Feature: '#2980B9',
    Bugfix:  '#C0392B',
    Deploy:  '#8E44AD',
    Review:  '#16A085',
    Reunião: '#E67E22',
  };

  const filteredTasks = (workTasks || []).filter(t => {
    if (filter === 'all') return true;
    return t.prio === filter;
  });

  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* CARD DE EXPEDIENTE / ENCERRAMENTO */}
      {dayClosed ? (
        <Card style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: '#166534', marginBottom: 4 }}>
            Expediente de hoje encerrado!
          </Text>
          <Text style={[s.sub, { color: '#15803D', fontSize: 13, marginBottom: 10 }]}>
            Parabéns pelo foco de hoje. Agora vire a chave para a família, a parceria e o seu descanso. O trabalho continua amanhã às 8h.
          </Text>
          <TouchableOpacity
            style={[s.chipLine, { alignSelf: 'flex-start', backgroundColor: '#fff', borderColor: '#86EFAC' }]}
            onPress={reopenWorkDay}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>Reabrir expediente</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink }}>
                Expediente: {myProfile?.start || workProfile?.myStart || 8}h às {myProfile?.end || workProfile?.myEnd || 17}h
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                <TouchableOpacity onPress={() => openAlimentar && openAlimentar('almoco')}>
                  <Text style={[s.sub, { marginBottom: 0, color: '#1B5E20', fontWeight: '700' }]}>
                    Almoço às 13h (ver no Manjar)
                  </Text>
                </TouchableOpacity>
                <Text style={[s.sub, { marginBottom: 0 }]}>
                  · Prioridades de hoje: {p1Done} de {p1Total} feitas
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: '#1E7E34', paddingVertical: 8, paddingHorizontal: 12, marginBottom: 0 }]}
              onPress={() => {
                Alert.alert(
                  'Encerrar expediente?',
                  'Hora de fechar o computador e descansar com a família.',
                  [
                    { text: 'Continuar' },
                    { text: 'Encerrar agora', onPress: closeWorkDay }
                  ]
                );
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Encerrar dia</Text>
            </TouchableOpacity>
          </View>

          {p1Total > 3 && (
            <View style={{ marginTop: 10, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#B91C1C' }}>
                Atenção: mais de 3 tarefas P1 aumentam o risco de sobrecarga. Mantenha no máximo 3 essenciais.
              </Text>
            </View>
          )}
        </Card>
      )}

      {/* BLOCO COMPACTO DE FOCO POMODORO */}
      <View style={s.pomodoroCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.ink }}>Bloco de foco técnico</Text>
            <Text style={[s.sub, { fontSize: 12, marginBottom: 0 }]}>Programe sem interrupções</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: running ? '#2980B9' : C.ink }}>
            {`${pad(Math.floor(timer / 60))}:${pad(timer % 60)}`}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' }}>
          {[[25, '25 min'], [50, '50 min']].map(([m, lbl]) => (
            <TouchableOpacity
              key={m}
              style={[s.chipLine, pm === m && { backgroundColor: '#3F5FB5', borderColor: '#3F5FB5' }]}
              onPress={() => { if (!running) { setPm(m); setTimer(m * 60); } }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: pm === m ? '#fff' : C.ink }}>{lbl}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.btn, { paddingVertical: 6, paddingHorizontal: 16, marginBottom: 0, backgroundColor: running ? '#E67E22' : '#2980B9' }]}
            onPress={startStop}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{running ? 'Pausar' : 'Focar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.chipLine, { paddingVertical: 6, paddingHorizontal: 10 }]}
            onPress={() => { clearInterval(ivRef.current); setRunning(false); setTimer(pm * 60); }}
          >
            <Text style={{ fontSize: 11, color: C.mute }}>Zerar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FILTROS DE PRIORIDADE */}
      <View style={{ flexDirection: 'row', gap: 6, marginVertical: 10 }}>
        {[
          ['all', 'Todas'],
          ['P1', 'P1 · Vital hoje'],
          ['P2', 'P2 · Semana'],
          ['P3', 'P3 · Backlog'],
        ].map(([p, lbl]) => (
          <TouchableOpacity
            key={p}
            style={[s.filterPill, filter === p && s.filterPillActive]}
            onPress={() => setFilter(p)}
          >
            <Text style={[s.filterPillTxt, filter === p && s.filterPillTxtActive]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTAGEM DE TAREFAS */}
      {filteredTasks.length === 0 && (
        <Text style={[s.sub, { textAlign: 'center', marginVertical: 20 }]}>
          Nenhuma tarefa cadastrada nesta categoria.
        </Text>
      )}

      {filteredTasks.map(t => (
        <View key={t.id} style={s.taskRow}>
          <TouchableOpacity onPress={() => toggle(t.id)} style={{ marginRight: 6 }}>
            <Text style={{ fontSize: 20, color: t.done ? '#10B981' : C.mute }}>{t.done ? 'v' : 'o'}</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: 15, fontWeight: '600', color: C.ink }, t.done && { textDecorationLine: 'line-through', color: C.mute }]}>
              {t.txt}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'center' }}>
              <View style={[s.badgePill, { backgroundColor: PRIO_COLORS[t.prio] + '18' }]}>
                <Text style={[s.badgePillTxt, { color: PRIO_COLORS[t.prio] }]}>{t.prio}</Text>
              </View>
              {t.tag && (
                <View style={[s.badgePill, { backgroundColor: TAG_COLORS[t.tag] + '18' }]}>
                  <Text style={[s.badgePillTxt, { color: TAG_COLORS[t.tag] || C.mute }]}>{t.tag}</Text>
                </View>
              )}
              {t.est ? <Text style={{ fontSize: 11, color: C.mute }}>{t.est} min</Text> : null}
            </View>
          </View>

          <TouchableOpacity onPress={() => del(t.id)} style={{ paddingHorizontal: 6 }}>
            <Text style={{ color: C.mute, fontSize: 18 }}>x</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* BOTÃO OU FORMULÁRIO DE NOVA TAREFA */}
      {!showAdd ? (
        <TouchableOpacity
          style={[s.chipLine, { alignSelf: 'center', marginTop: 12, paddingVertical: 10, paddingHorizontal: 20, borderColor: C.accent }]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent }}>+ Nova prioridade de foco</Text>
        </TouchableOpacity>
      ) : (
        <Card style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.ink }}>Nova prioridade de trabalho</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={{ fontSize: 13, color: C.mute }}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[s.inp, { marginBottom: 10 }]}
            placeholder="Ex: Corrigir bug no checkout do app..."
            value={txt}
            onChangeText={setTxt}
          />

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, alignItems: 'center' }}>
            <Text style={[s.sub, { width: 70, marginBottom: 0 }]}>Prioridade:</Text>
            {['P1', 'P2', 'P3'].map(p => (
              <TouchableOpacity
                key={p}
                style={[s.chipLine, prio === p && { backgroundColor: PRIO_COLORS[p], borderColor: PRIO_COLORS[p] }]}
                onPress={() => setPrio(p)}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: prio === p ? '#fff' : C.ink }}>
                  {p === 'P1' ? 'P1 (Hoje)' : (p === 'P2' ? 'P2 (Semana)' : 'P3 (Backlog)')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={[s.sub, { width: 70, marginBottom: 0 }]}>Tipo:</Text>
            {['Feature', 'Bugfix', 'Deploy', 'Review', 'Reunião'].map(tg => (
              <TouchableOpacity
                key={tg}
                style={[s.chipLine, tag === tg && { backgroundColor: TAG_COLORS[tg], borderColor: TAG_COLORS[tg] }]}
                onPress={() => setTag(tg)}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: tag === tg ? '#fff' : C.ink }}>{tg}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 12 }}>
            <Text style={[s.sub, { width: 70, marginBottom: 0 }]}>Estimativa:</Text>
            <TextInput
              style={[s.inp, { width: 60, marginBottom: 0, paddingVertical: 6, textAlign: 'center' }]}
              keyboardType="numeric"
              value={est}
              onChangeText={setEst}
            />
            <Text style={s.sub}>minutos</Text>
          </View>

          <Btn t="Salvar prioridade" onPress={add} />
        </Card>
      )}
    </ScrollView>
  );
}

// ─── ABA EU ───────────────────────────────────────────────────────────────────
function TabEu({ selfS, saveSelf, cfgIdeas, cfgSet }) {
  const v = selfS();
  const [timer, setTimer] = useState(50 * 60);
  const [running, setRunning] = useState(false);
  const [pm, setPm] = useState(50);
  const ivRef = useRef(null);

  const [curIdea, setCurIdea] = useState('');
  const [mineIdea, setMineIdea] = useState('');

  const allEuIdeas = [...IDEAS_EU, ...(cfgIdeas?.eu || [])];

  const rollIdea = () => {
    let next;
    do {
      next = allEuIdeas[Math.floor(Math.random() * allEuIdeas.length)];
    } while (next === curIdea && allEuIdeas.length > 1);
    setCurIdea(next);
  };

  const saveMineIdea = async list => {
    const nextCfg = { ...cfgIdeas, eu: list };
    await cfgSet('ideas', nextCfg);
  };

  const applyIdeaToTimer = minutes => {
    if (!running) {
      setPm(minutes);
      setTimer(minutes * 60);
    }
  };

  const startStop = () => {
    if (running) {
      clearInterval(ivRef.current);
      setRunning(false);
    } else {
      const e = Date.now() + timer * 1000;
      ivRef.current = setInterval(() => {
        const l = Math.round((e - Date.now()) / 1000);
        setTimer(Math.max(0, l));
        if (l <= 0) {
          clearInterval(ivRef.current);
          setRunning(false);
        }
      }, 500);
      setRunning(true);
    }
  };

  useEffect(() => () => clearInterval(ivRef.current), []);

  const done = Object.keys(v.done).length;
  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* SEÇÃO DE IDEIAS PARTICULARES (SÓ MEU) */}
      <Text style={s.h2}>Pausas e autocuidado particular</Text>
      <Text style={s.sub}>Momentos exclusivos para você recarregar as energias.</Text>

      <Card style={{ marginTop: 6, marginBottom: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink }}>
          {curIdea || 'Toque em Sortear para ver uma sugestão de pausa para si.'}
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Btn t="Sortear momento para mim" onPress={rollIdea} />
        {curIdea && (
          <Btn t="Usar 20 min no cronômetro" ghost onPress={() => applyIdeaToTimer(20)} />
        )}
      </View>

      {/* MINHAS IDEIAS PARTICULARES */}
      {(cfgIdeas?.eu || []).length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[s.sub, { fontWeight: '700', color: C.ink }]}>Minhas ideias salvas</Text>
          {(cfgIdeas?.eu || []).map((t, i) => (
            <View key={i} style={s.taskRow}>
              <Text style={{ flex: 1, fontSize: 14 }}>{t}</Text>
              <TouchableOpacity onPress={() => {
                const list = [...(cfgIdeas?.eu || [])];
                list.splice(i, 1);
                saveMineIdea(list);
              }}>
                <Text style={{ color: C.mute, fontSize: 20, padding: 4 }}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        <TextInput
          style={[s.inp, { flex: 1, marginBottom: 0 }]}
          placeholder="Adicionar ideia de pausa sua"
          value={mineIdea}
          onChangeText={setMineIdea}
        />
        <TouchableOpacity
          style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]}
          onPress={() => {
            if (!mineIdea.trim()) return;
            saveMineIdea([...(cfgIdeas?.eu || []), mineIdea.trim()]);
            setMineIdea('');
          }}
        >
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      {/* CUIDADOS DIÁRIOS */}
      <Text style={s.h2}>Cuidados diários</Text>
      <Card><Text style={{ fontWeight: '800' }}>{done} de {v.items.length} cuidados feitos hoje.</Text></Card>
      {v.items.map(it => {
        const dn = !!v.done[it.i];
        return (
          <TouchableOpacity
            key={it.i}
            style={[s.taskRow, dn && { opacity: 0.5 }]}
            onPress={() => {
              const nd = { ...v.done };
              if (dn) delete nd[it.i];
              else nd[it.i] = 1;
              saveSelf({ done: nd });
            }}
          >
            <Text style={{ fontSize: 26 }}>{dn ? 'v' : 'o'}</Text>
            <Text style={[{ flex: 1, fontSize: 16 }, dn && { textDecorationLine: 'line-through' }]}>{it.x}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={[s.taskRow, { marginTop: 8 }]}>
        <Text style={{ flex: 1, fontWeight: '800' }}>Copos de água</Text>
        <TouchableOpacity style={s.chipLine} onPress={() => saveSelf({ water: Math.max(0, v.water - 1) })}>
          <Text style={{ fontWeight: '800', fontSize: 16 }}>-</Text>
        </TouchableOpacity>
        <Text style={{ fontWeight: '800', fontSize: 18, marginHorizontal: 10 }}>{v.water}</Text>
        <TouchableOpacity style={s.chipLine} onPress={() => saveSelf({ water: v.water + 1 })}>
          <Text style={{ fontWeight: '800', fontSize: 16 }}>+</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <Text style={{ fontWeight: '800', marginBottom: 8 }}>Minha energia hoje</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[[1, 'Baixa'], [2, 'Ok'], [3, 'Boa']].map(([e, n]) => (
            <TouchableOpacity key={e} style={[s.chipLine, v.energy === e && { backgroundColor: C.accent }]} onPress={() => saveSelf({ energy: e })}>
              <Text style={{ fontWeight: '700', color: v.energy === e ? '#fff' : C.ink }}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Text style={[s.sub, { marginTop: 16 }]}>Cronômetro de foco e descanso</Text>
      <View style={{ alignItems: 'center', padding: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {[[50, '50 min'], [25, '25 min'], [20, '20 min — Pausa']].map(([m, n]) => (
            <TouchableOpacity key={m} style={[s.chipLine, pm === m && { backgroundColor: C.accent }]} onPress={() => { if (!running) { setPm(m); setTimer(m * 60); } }}>
              <Text style={{ fontWeight: '700', fontSize: 12, color: pm === m ? '#fff' : C.ink }}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontSize: 72, fontWeight: '800', color: running ? C.foco : C.ink }}>
          {`${pad(Math.floor(timer / 60))}:${pad(timer % 60)}`}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Btn t={running ? 'Pausar' : 'Começar'} onPress={startStop} />
          <Btn t="Zerar" ghost onPress={() => { clearInterval(ivRef.current); setRunning(false); setTimer(pm * 60); }} />
        </View>
      </View>
    </ScrollView>
  );
}

// ─── ABA MINHAS NOTAS PARTICULARES ───────────────────────────────────────────
function TabMinhasNotas({ privateNotes, savePrivateNotes, hid, uid }) {
  const [txt, setTxt] = useState('');

  const add = () => {
    if (!txt.trim()) return;
    const note = { id: 'pn_' + Date.now(), txt: txt.trim(), at: new Date().toLocaleDateString('pt-BR') };
    savePrivateNotes([note, ...(privateNotes || [])]);
    setTxt('');
  };

  const del = id => {
    savePrivateNotes((privateNotes || []).filter(x => x.id !== id));
  };

  const shareToHouse = async note => {
    await sb.from('notes').insert({ household_id: hid, txt: note.txt, by: uid, created_at: new Date().toISOString() });
    Alert.alert('Compartilhado', 'Essa nota agora aparece no mural compartilhado em Nós.');
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Card style={{ borderLeftColor: '#8E44AD' }}>
        <Text style={{ fontWeight: '800', color: '#8E44AD', marginBottom: 4 }}>Espaço particular</Text>
        <Text style={s.sub}>Estas anotações ficam guardadas exclusivamente no seu celular. Ninguém mais na casa tem acesso.</Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput
          style={[s.inp, { flex: 1, marginBottom: 0 }]}
          placeholder="Escreva um pensamento ou lembrete particular..."
          value={txt}
          onChangeText={setTxt}
        />
        <TouchableOpacity style={[s.btn, { marginBottom: 0, backgroundColor: '#8E44AD', paddingHorizontal: 16 }]} onPress={add}>
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      {(privateNotes || []).length === 0 && (
        <Text style={[s.sub, { textAlign: 'center', marginTop: 24 }]}>Nenhuma nota particular ainda. Suas anotações privadas ficam guardadas aqui.</Text>
      )}

      {(privateNotes || []).map(n => (
        <Card key={n.id} style={{ borderLeftColor: '#8E44AD' }}>
          <Text style={{ fontSize: 15, color: C.ink, marginBottom: 6 }}>{n.txt}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 }}>
            <Text style={{ fontSize: 11, color: C.mute }}>{n.at}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => shareToHouse(n)}>
                <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>Compartilhar com a casa</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => del(n.id)}>
                <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 12 }}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

// ─── ABA MINHAS TAREFAS PARTICULARES ─────────────────────────────────────────
function TabMinhasTarefas({ privateTasks, savePrivateTasks, hid, uid }) {
  const [txt, setTxt] = useState('');

  const add = () => {
    if (!txt.trim()) return;
    const task = { id: 'pt_' + Date.now(), txt: txt.trim(), done: false };
    savePrivateTasks([task, ...(privateTasks || [])]);
    setTxt('');
  };

  const toggle = id => {
    const list = (privateTasks || []).map(t => t.id === id ? { ...t, done: !t.done } : t);
    savePrivateTasks(list);
  };

  const del = id => {
    savePrivateTasks((privateTasks || []).filter(x => x.id !== id));
  };

  const moveToHouse = async task => {
    await sb.from('tasks').insert({ household_id: hid, title: task.txt, minutes: 15, who: uid, assigned_to: uid });
    del(task.id);
    Alert.alert('Movida', 'A tarefa foi transferida para a lista compartilhada da Casa.');
  };

  return (
    <ScrollView contentContainerStyle={s.pad}>
      <Card style={{ borderLeftColor: '#2E7D32' }}>
        <Text style={{ fontWeight: '800', color: '#2E7D32', marginBottom: 4 }}>Minhas tarefas particulares</Text>
        <Text style={s.sub}>Afazeres individuais (médicos, compromissos pessoais, surpresas). Não aparecem para o parceiro.</Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput
          style={[s.inp, { flex: 1, marginBottom: 0 }]}
          placeholder="Nova tarefa pessoal..."
          value={txt}
          onChangeText={setTxt}
        />
        <TouchableOpacity style={[s.btn, { marginBottom: 0, backgroundColor: '#2E7D32', paddingHorizontal: 16 }]} onPress={add}>
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      {(privateTasks || []).length === 0 && (
        <Text style={[s.sub, { textAlign: 'center', marginTop: 24 }]}>Nenhuma tarefa particular pendente.</Text>
      )}

      {(privateTasks || []).map(t => (
        <View key={t.id} style={[s.taskRow, { borderLeftWidth: 4, borderLeftColor: t.done ? C.line : '#2E7D32' }]}>
          <TouchableOpacity onPress={() => toggle(t.id)} style={{ marginRight: 4 }}>
            <Text style={{ fontSize: 20, color: t.done ? '#4CAF50' : C.mute }}>{t.done ? 'v' : 'o'}</Text>
          </TouchableOpacity>
          <Text style={[{ flex: 1, fontSize: 15, color: C.ink }, t.done && { textDecorationLine: 'line-through', color: C.mute }]}>{t.txt}</Text>
          <TouchableOpacity onPress={() => moveToHouse(t)} style={{ paddingHorizontal: 6 }}>
            <Text style={{ color: C.accent, fontWeight: '700', fontSize: 12 }}>Mover p/ casa</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => del(t.id)} style={{ paddingHorizontal: 4 }}>
            <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 12 }}>x</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── ABA CELINE ───────────────────────────────────────────────────────────────
function TabCeline({ care, careDone, setCareDone, saveOfflineCache, hid, uid, whoOf, logDone, openAlimentar, cfgIdeas, cfgSet }) {
  const [editMode, setEditMode] = useState(false);
  const [newAt, setNewAt] = useState('');
  const [newLabel, setNewLabel] = useState('');

  // Navegação dinâmica de datas (o dia não fica estático)
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [otherDayDone, setOtherDayDone] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  // Ideias e brincadeiras para Celine
  const [curIdea, setCurIdea] = useState('');
  const [mineIdea, setMineIdea] = useState('');

  const selectedDayKey = `${selectedDate.getFullYear()}-${pad(selectedDate.getMonth() + 1)}-${pad(selectedDate.getDate())}`;
  const isSelectedToday = selectedDayKey === todayS();

  const now = new Date();
  const nm = now.getHours() * 60 + now.getMinutes();

  // Carrega care_done dinamicamente se o usuário estiver vendo outro dia
  useEffect(() => {
    if (isSelectedToday) {
      setOtherDayDone([]);
      return;
    }
    let isMounted = true;
    setLoadingDay(true);
    sb.from('care_done')
      .select('*')
      .eq('household_id', hid)
      .eq('day', selectedDayKey)
      .then(res => {
        if (isMounted) {
          setOtherDayDone(res.data || []);
          setLoadingDay(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingDay(false);
      });
    return () => { isMounted = false; };
  }, [selectedDayKey, isSelectedToday, hid]);

  const activeDoneList = isSelectedToday ? careDone : otherDayDone;

  const nextIdx = isSelectedToday ? care.findIndex(it => {
    const [h, m] = (it.hhmm || '08:00').split(':').map(Number);
    return !activeDoneList.find(d => d.item_id === it.id) && (h * 60 + m) >= nm - 45;
  }) : -1;

  const doneCount = activeDoneList.length;

  const fixT = v => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
    if (!m || +m[1] > 23 || +m[2] > 59) return null;
    return `${pad(+m[1])}:${m[2]}`;
  };

  const changeDate = days => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const selectWeekday = targetDayIdx => {
    const next = new Date(selectedDate);
    const currentDayIdx = next.getDay();
    const diff = targetDayIdx - currentDayIdx;
    next.setDate(next.getDate() + diff);
    setSelectedDate(next);
  };

  const toggleCareItem = async (it, d) => {
    if (d) {
      if (isSelectedToday) {
        if (setCareDone) {
          setCareDone(prev => {
            const next = prev.filter(x => x.item_id !== it.id);
            if (saveOfflineCache) saveOfflineCache({ careDone: next });
            return next;
          });
        }
        logDone('c' + it.id, false);
      } else {
        setOtherDayDone(prev => prev.filter(x => x.item_id !== it.id));
      }
      sb.from('care_done').delete().eq('item_id', it.id).eq('day', selectedDayKey).catch(() => {});
    } else {
      const newRecord = { household_id: hid, item_id: it.id, day: selectedDayKey, by: uid };
      if (isSelectedToday) {
        if (setCareDone) {
          setCareDone(prev => {
            const next = [...prev.filter(x => x.item_id !== it.id), newRecord];
            if (saveOfflineCache) saveOfflineCache({ careDone: next });
            return next;
          });
        }
        logDone('c' + it.id, true);
      } else {
        setOtherDayDone(prev => [...prev, newRecord]);
      }
      sb.from('care_done').insert(newRecord).catch(() => {});
    }
  };

  // Ideias com Celine
  const allCelineIdeas = [...IDEAS_CELINE, ...(cfgIdeas?.celine || [])];

  const rollIdea = () => {
    let next;
    do {
      next = allCelineIdeas[Math.floor(Math.random() * allCelineIdeas.length)];
    } while (next === curIdea && allCelineIdeas.length > 1);
    setCurIdea(next);
  };

  const saveMineIdea = async list => {
    const nextCfg = { ...cfgIdeas, celine: list };
    await cfgSet('ideas', nextCfg);
  };

  const dayName = DN[selectedDate.getDay()];
  const formattedDayTitle = `${isSelectedToday ? 'Hoje · ' : ''}${dayName}, ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`;

  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* NAVEGADOR DINÂMICO DE DATA (CORREÇÃO DO DIA ESTÁTICO) */}
      <View style={s.dateNavCard}>
        <View style={s.dateNavHeader}>
          <TouchableOpacity style={s.dateNavArrowBtn} onPress={() => changeDate(-1)}>
            <Text style={s.dateNavArrowTxt}>‹</Text>
          </TouchableOpacity>

          <View style={s.dateNavTitleBox}>
            <Text style={s.dateNavMainTitle}>{formattedDayTitle}</Text>
            {!isSelectedToday && (
              <TouchableOpacity onPress={goToToday} style={s.dateNavTodayPill}>
                <Text style={s.dateNavTodayPillTxt}>Voltar para hoje</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={s.dateNavArrowBtn} onPress={() => changeDate(1)}>
            <Text style={s.dateNavArrowTxt}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ATALHOS RÁPIDOS DOS DIAS DA SEMANA */}
        <View style={s.weekStripRow}>
          {DN.map((d, i) => {
            const isDaySelected = selectedDate.getDay() === i;
            return (
              <TouchableOpacity
                key={i}
                style={[s.weekDayPill, isDaySelected && s.weekDayPillActive]}
                onPress={() => selectWeekday(i)}
              >
                <Text style={[s.weekDayPillTxt, isDaySelected && s.weekDayPillTxtActive]}>
                  {d.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* CABEÇALHO DO RESUMO DO DIA */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Card style={{ flex: 1, marginBottom: 0 }}>
          <Text style={{ fontWeight: '800' }}>
            {doneCount} de {care.length} cuidados registados {isSelectedToday ? 'hoje' : 'neste dia'}.
          </Text>
        </Card>
        <TouchableOpacity style={{ paddingLeft: 12 }} onPress={() => setEditMode(!editMode)}>
          <Text style={{ color: C.accent, fontWeight: '800' }}>{editMode ? 'Concluir' : 'Editar rotina'}</Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DOS ITENS DE CUIDADO */}
      {care.map((it, i) => {
        const d = activeDoneList.find(x => x.item_id === it.id);
        if (editMode) return (
          <View key={it.id} style={s.taskRow}>
            <TextInput
              style={[s.inp, { width: 72, marginBottom: 0 }]}
              defaultValue={it.hhmm}
              onEndEditing={e => {
                const t = fixT(e.nativeEvent.text);
                if (t) sb.from('care_items').update({ hhmm: t }).eq('id', it.id);
                else Alert.alert('Use o formato 13:30');
              }}
            />
            <TextInput
              style={[s.inp, { flex: 1, marginBottom: 0 }]}
              defaultValue={it.label}
              onEndEditing={e => e.nativeEvent.text.trim() && sb.from('care_items').update({ label: e.nativeEvent.text.trim() }).eq('id', it.id)}
            />
            <TouchableOpacity onPress={() => Alert.alert('Apagar?', it.label, [{ text: 'Cancelar' }, { text: 'Apagar', style: 'destructive', onPress: () => sb.from('care_items').delete().eq('id', it.id) }])}>
              <Text style={{ color: C.mute, fontSize: 22, padding: 4 }}>x</Text>
            </TouchableOpacity>
          </View>
        );

        const isLunchC = it.id === 'c6' || /almo[çc]o/i.test(it.label);
        const isDinnerC = it.id === 'c10' || /janta/i.test(it.label);

        return (
          <TouchableOpacity
            key={it.id}
            style={[s.taskRow, i === nextIdx && { borderLeftWidth: 4, borderLeftColor: C.filha }]}
            onPress={() => toggleCareItem(it, d)}
          >
            <Text style={{ fontSize: 26 }}>{d ? 'v' : 'o'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 16 }, d && { textDecorationLine: 'line-through', color: C.mute }]}>
                <Text style={{ fontWeight: '800' }}>{it.hhmm} </Text>{it.label}
              </Text>
              {d ? <Text style={s.sub}>Feito por {d.by === uid ? 'você' : whoOf(d.by)}</Text> : null}
            </View>
            {(isLunchC || isDinnerC) && (
              <TouchableOpacity
                style={s.careMealBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  openAlimentar && openAlimentar(isLunchC ? 'almoco' : 'jantar');
                }}
              >
                <Text style={s.careMealBtnTxt}>Manjar ›</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}

      {editMode && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput style={[s.inp, { width: 72, marginBottom: 0 }]} placeholder="13:30" value={newAt} onChangeText={setNewAt} />
          <TextInput style={[s.inp, { flex: 1, marginBottom: 0 }]} placeholder="Novo item de cuidado" value={newLabel} onChangeText={setNewLabel} />
          <TouchableOpacity
            style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]}
            onPress={async () => {
              const t = fixT(newAt);
              if (!t || !newLabel.trim()) return Alert.alert('Use o formato 13:30 e escreva o item.');
              await sb.from('care_items').insert({ household_id: hid, hhmm: t, label: newLabel.trim() });
              setNewAt('');
              setNewLabel('');
            }}
          >
            <Text style={s.btnT}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEÇÃO DE IDEIAS E BRINCADEIRAS COM CELINE */}
      <View style={{ marginTop: 20, marginBottom: 8 }}>
        <Text style={s.h2}>Ideias e brincadeiras para Celine</Text>
        <Text style={s.sub}>Sugestões de estímulo, conexão e diversão para o dia.</Text>
      </View>

      <Card style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink }}>
          {curIdea || 'Toque em Sortear para ver uma brincadeira com Celine.'}
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <Btn t="Sortear brincadeira" onPress={rollIdea} />
      </View>

      {/* MINHAS BRINCADEIRAS SALVAS */}
      {(cfgIdeas?.celine || []).length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[s.sub, { fontWeight: '700', color: C.ink }]}>Brincadeiras personalizadas salvas</Text>
          {(cfgIdeas?.celine || []).map((t, i) => (
            <View key={i} style={s.taskRow}>
              <Text style={{ flex: 1, fontSize: 14 }}>{t}</Text>
              <TouchableOpacity onPress={() => {
                const list = [...(cfgIdeas?.celine || [])];
                list.splice(i, 1);
                saveMineIdea(list);
              }}>
                <Text style={{ color: C.mute, fontSize: 20, padding: 4 }}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <TextInput
          style={[s.inp, { flex: 1, marginBottom: 0 }]}
          placeholder="Adicionar nova brincadeira para Celine"
          value={mineIdea}
          onChangeText={setMineIdea}
        />
        <TouchableOpacity
          style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]}
          onPress={() => {
            if (!mineIdea.trim()) return;
            saveMineIdea([...(cfgIdeas?.celine || []), mineIdea.trim()]);
            setMineIdea('');
          }}
        >
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sub}>Os horários são sugestão. Ajuste ao ritmo da criança e às orientações do pediatra.</Text>
    </ScrollView>
  );
}

// ─── PERGUNTAS DO JOGO DE SINTONIA DO CASAL ──────────────────────────────────
const JOGO_PERGUNTAS = [
  {
    cat: 'Rotina e hábitos',
    q: 'Qual é a primeira coisa que seu parceiro costuma fazer ao acordar?',
    opts: [
      'Olhar o celular e checar mensagens',
      'Levantar direto para tomar café ou água',
      'Ficar mais alguns minutos na cama enrolando',
      'Ir direto ao banheiro e lavar o rosto'
    ]
  },
  {
    cat: 'Rotina e hábitos',
    q: 'Como seu parceiro reage quando está com muita fome e a comida demora?',
    opts: [
      'Fica impaciente e começa a beliscar qualquer coisa',
      'Tenta manter a calma, mas fecha a cara em silêncio',
      'Transforma o momento em piada para aliviar o estresse',
      'Reclama abertamente até a comida chegar'
    ]
  },
  {
    cat: 'Rotina e hábitos',
    q: 'Em um dia livre sem planos, qual é o cenário ideal para ele ou ela?',
    opts: [
      'Ficar em casa curtindo sofá, série e descanso total',
      'Sair para passear, comer fora ou explorar um lugar novo',
      'Fazer tarefas acumuladas e organizar a casa com calma',
      'Praticar exercício, caminhar ao ar livre ou cuidar de hobbies'
    ]
  },
  {
    cat: 'Preferências e gostos',
    q: 'Se pudesse escolher apenas uma comida para um jantar especial, qual seria?',
    opts: [
      'Pizza artesanal ou massas com molho especial',
      'Churrasco ou carne nobre com acompanhamentos',
      'Comida japonesa ou pratos orientais',
      'Prato caseiro de conforto feito com carinho'
    ]
  },
  {
    cat: 'Preferências e gostos',
    q: 'Qual tipo de sobremesa conquista o parceiro imediatamente?',
    opts: [
      'Doces com bastante chocolate ou brigadeiro',
      'Sobremesas leves e ácidas, como torta de limão ou maracujá',
      'Sorvete cremoso com calda ou casquinha',
      'Não é muito fã de doces, prefere algo salgado'
    ]
  },
  {
    cat: 'Preferências e gostos',
    q: 'Qual é o estilo de viagem que mais combina com seu parceiro?',
    opts: [
      'Praia com mar calmo, sol e tranquilidade total',
      'Serra ou campo com clima frio, lareira e natureza',
      'Viagem cultural para cidades históricas ou capitais agitadas',
      'Viagem de aventura com trilhas, cachoeiras e passeios ativos'
    ]
  },
  {
    cat: 'Relacionamento e história',
    q: 'Qual foi a primeira impressão que seu parceiro teve de você no primeiro encontro?',
    opts: [
      'Achou interessante e charmoso ou charmosa na hora',
      'Achou engraçado ou espontâneo, com conversa fácil',
      'Achou um pouco tímido ou reservado no início',
      'Sentiu uma conexão imediata, como velhos conhecidos'
    ]
  },
  {
    cat: 'Relacionamento e história',
    q: 'Qual demonstração de afeto seu parceiro mais valoriza no cotidiano?',
    opts: [
      'Toque físico: abraço apertado, carinho e mãos dadas',
      'Palavras gentis: elogios sinceros e conversas de apoio',
      'Atos de serviço: ajudar nas tarefas ou facilitar o dia',
      'Tempo de qualidade: presença atenta sem distrações'
    ]
  },
  {
    cat: 'Dilemas e situações',
    q: 'Se ganhassem um prêmio financeiro inesperado hoje, qual seria a prioridade dele ou dela?',
    opts: [
      'Fazer uma viagem dos sonhos sem se preocupar com despesas',
      'Investir tudo ou quitar compromissos para garantir tranquilidade',
      'Comprar ou reformar a casa dos sonhos',
      'Dividir entre uma boa comemoração e uma reserva segura'
    ]
  },
  {
    cat: 'Sonhos e futuro',
    q: 'Qual é o maior desejo do seu parceiro para os próximos anos?',
    opts: [
      'Alcançar estabilidade profissional e financeira sólida',
      'Realizar metas familiares, viagens e momentos especiais',
      'Conquistar mais tempo livre, paz de espírito e saúde',
      'Construir um lar cada vez mais acolhedor e seguro'
    ]
  }
];

const JOGO_BATE_PRONTO = [
  'Quem demora mais tempo para se arrumar antes de sair de casa?',
  'Quem é mais provável de dormir nos primeiros minutos de um filme?',
  'Quem costuma ser o mais esquecido com chaves, celular ou compromissos?',
  'Quem é mais apegado ou ciumento no relacionamento?',
  'Quem tem mais paciência em situações difíceis ou filas?',
  'Quem gasta mais dinheiro em compras por impulso?',
  'Quem cozinha melhor ou inventa as melhores receitas em casa?',
  'Quem pede desculpas primeiro após uma discussão boba?',
  'Quem costuma planejar passeios e viagens com mais antecedência?',
  'Quem é mais emotivo e chora mais fácil com filmes ou homenagens?'
];

// ─── COMPONENTE DO JOGO DA SINTONIA DO CASAL ──────────────────────────────────
function JogoDoCasal({ myName = 'Você', partnerName = 'Parceiro(a)' }) {
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('duo'); // 'duo', 'solo', 'quick'
  const [qCount, setQCount] = useState(5);
  const [qIndex, setQIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);

  // Estados do modo duo
  const [duoStep, setDuoStep] = useState('subject'); // 'subject', 'curtain', 'guesser', 'reveal'
  const [tempChoice, setTempChoice] = useState(null);
  const [duoSubjectChoice, setDuoSubjectChoice] = useState(null);
  const [duoGuesserChoice, setDuoGuesserChoice] = useState(null);

  // Estados do modo solo
  const [soloPhase, setSoloPhase] = useState(1); // 1: my answers, 2: curtain, 3: partner guesser
  const [soloMyAnswers, setSoloMyAnswers] = useState([]);
  const [soloPartnerAnswers, setSoloPartnerAnswers] = useState([]);

  // Estados do modo bate-pronto
  const [quickStep, setQuickStep] = useState(1); // 1: p1, 2: curtain, 3: p2, 4: reveal
  const [quickP1Choice, setQuickP1Choice] = useState(null);
  const [quickP2Choice, setQuickP2Choice] = useState(null);

  // Histórico da partida atual
  const [finished, setFinished] = useState(false);
  const [answersLog, setAnswersLog] = useState([]);

  const startNewGame = (chosenMode = mode, count = qCount) => {
    setFinished(false);
    setScore(0);
    setQIndex(0);
    setTempChoice(null);
    setAnswersLog([]);

    if (chosenMode === 'quick') {
      const shuffled = [...JOGO_BATE_PRONTO].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, count));
      setQuickStep(1);
      setQuickP1Choice(null);
      setQuickP2Choice(null);
    } else {
      const shuffled = [...JOGO_PERGUNTAS].sort(() => 0.5 - Math.random());
      setQuestions(shuffled.slice(0, count));

      if (chosenMode === 'duo') {
        setDuoStep('subject');
        setDuoSubjectChoice(null);
        setDuoGuesserChoice(null);
      } else {
        setSoloPhase(1);
        setSoloMyAnswers([]);
        setSoloPartnerAnswers([]);
      }
    }
    setPlaying(true);
  };

  const currentQ = questions[qIndex] || null;
  const isMeSubject = (qIndex % 2 === 0);
  const subjectName = isMeSubject ? myName : partnerName;
  const guesserName = isMeSubject ? partnerName : myName;

  // Lógica de confirmação do modo duo
  const handleDuoSubjectConfirm = () => {
    if (tempChoice === null) return;
    setDuoSubjectChoice(tempChoice);
    setTempChoice(null);
    setDuoStep('curtain');
  };

  const handleDuoGuesserConfirm = () => {
    if (tempChoice === null) return;
    const match = tempChoice === duoSubjectChoice;
    setDuoGuesserChoice(tempChoice);
    if (match) setScore(prev => prev + 1);

    setAnswersLog(prev => [
      ...prev,
      {
        q: currentQ.q,
        subName: subjectName,
        gueName: guesserName,
        subAns: currentQ.opts[duoSubjectChoice],
        gueAns: currentQ.opts[tempChoice],
        isMatch: match
      }
    ]);

    setTempChoice(null);
    setDuoStep('reveal');
  };

  const handleDuoNext = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(prev => prev + 1);
      setDuoSubjectChoice(null);
      setDuoGuesserChoice(null);
      setTempChoice(null);
      setDuoStep('subject');
    } else {
      setFinished(true);
    }
  };

  // Lógica de confirmação do modo solo
  const handleSoloConfirm = () => {
    if (tempChoice === null) return;

    if (soloPhase === 1) {
      const nextAnswers = [...soloMyAnswers, tempChoice];
      setSoloMyAnswers(nextAnswers);
      setTempChoice(null);

      if (qIndex + 1 < questions.length) {
        setQIndex(prev => prev + 1);
      } else {
        setSoloPhase(2);
        setQIndex(0);
      }
    } else if (soloPhase === 3) {
      const nextGuesses = [...soloPartnerAnswers, tempChoice];
      setSoloPartnerAnswers(nextGuesses);
      setTempChoice(null);

      if (qIndex + 1 < questions.length) {
        setQIndex(prev => prev + 1);
      } else {
        let finalScore = 0;
        const log = questions.map((item, idx) => {
          const myAns = item.opts[soloMyAnswers[idx]];
          const partAns = item.opts[nextGuesses[idx]];
          const isMatch = soloMyAnswers[idx] === nextGuesses[idx];
          if (isMatch) finalScore++;
          return {
            q: item.q,
            subName: myName,
            gueName: partnerName,
            subAns: myAns,
            gueAns: partAns,
            isMatch
          };
        });
        setScore(finalScore);
        setAnswersLog(log);
        setFinished(true);
      }
    }
  };

  // Lógica do modo bate-pronto
  const handleQuickVote = (chosenPerson) => {
    if (quickStep === 1) {
      setQuickP1Choice(chosenPerson);
      setQuickStep(2);
    } else if (quickStep === 3) {
      const isMatch = quickP1Choice === chosenPerson;
      if (isMatch) setScore(prev => prev + 1);

      setAnswersLog(prev => [
        ...prev,
        {
          q: currentQ,
          subName: myName,
          gueName: partnerName,
          subAns: quickP1Choice,
          gueAns: chosenPerson,
          isMatch
        }
      ]);
      setQuickP2Choice(chosenPerson);
      setQuickStep(4);
    }
  };

  const handleQuickNext = () => {
    if (qIndex + 1 < questions.length) {
      setQIndex(prev => prev + 1);
      setQuickP1Choice(null);
      setQuickP2Choice(null);
      setQuickStep(1);
    } else {
      setFinished(true);
    }
  };

  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
    <View style={{ marginTop: 18, marginBottom: 14 }}>
      <Text style={s.h2}>Jogo do casal</Text>
      <Text style={s.sub}>O quanto você conhece seu parceiro? Teste a sintonia e dê boas risadas a dois.</Text>

      {/* TELA INICIAL: SELEÇÃO DE MODO E INÍCIO */}
      {!playing && (
        <Card color={C.accent} style={{ marginTop: 8 }}>
          <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink, marginBottom: 6 }}>
            Escolha o formato da partida
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {[
              ['duo', 'Em conjunto'],
              ['solo', 'Individual'],
              ['quick', 'Bate-pronto']
            ].map(([k, label]) => (
              <TouchableOpacity
                key={k}
                style={[s.chipLine, mode === k && { backgroundColor: C.accent }]}
                onPress={() => setMode(k)}
              >
                <Text style={{ fontWeight: '700', fontSize: 13, color: mode === k ? '#fff' : C.ink }}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.sub, { marginBottom: 10 }]}>
            {mode === 'duo' && 'Joguem juntos passando o aparelho. Um parceiro responde sobre si e o outro tenta adivinhar, com revelação imediata a cada rodada.'}
            {mode === 'solo' && 'Você responde todo o questionário sobre suas preferências reais e depois entrega o celular para o parceiro acertar o gabarito.'}
            {mode === 'quick' && 'Perguntas rápidas sobre a rotina: ambos votam em quem dos dois mais combina com a situação e comparam as escolhas.'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 12 }}>
            <Text style={[s.sub, { fontWeight: '700' }]}>Perguntas:</Text>
            {[3, 5, 10].map(cnt => (
              <TouchableOpacity
                key={cnt}
                style={[s.chipLine, qCount === cnt && { backgroundColor: C.accent }]}
                onPress={() => setQCount(cnt)}
              >
                <Text style={{ fontWeight: '700', fontSize: 12, color: qCount === cnt ? '#fff' : C.ink }}>
                  {cnt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Btn t="Iniciar jogo do casal" onPress={() => startNewGame(mode, qCount)} />
        </Card>
      )}

      {/* PARTIDA EM ANDAMENTO */}
      {playing && !finished && currentQ && (
        <View style={{ marginTop: 8 }}>
          {/* BARRA DE PROGRESSO */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.mute }}>
              Pergunta {qIndex + 1} de {questions.length}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.accent }}>
              Acertos: {score}
            </Text>
          </View>

          {/* 1. MODO EM CONJUNTO */}
          {mode === 'duo' && (
            <View>
              {duoStep === 'subject' && (
                <Card color={C.accent}>
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: '800', textTransform: 'uppercase' }}>
                    Vez de {subjectName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    {subjectName}, escolha a sua resposta sincera sobre você. Não deixe {guesserName} ver a tela!
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink, marginBottom: 10 }}>
                    {currentQ.q}
                  </Text>

                  {currentQ.opts.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.inp,
                        tempChoice === i && { borderColor: C.accent, backgroundColor: '#E6F4F1' },
                        { padding: 10, marginBottom: 8 }
                      ]}
                      onPress={() => setTempChoice(i)}
                    >
                      <Text style={{ color: tempChoice === i ? C.accent : C.ink, fontWeight: tempChoice === i ? '700' : '400' }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <Btn t="Gravar e passar para o parceiro" onPress={handleDuoSubjectConfirm} />
                </Card>
              )}

              {duoStep === 'curtain' && (
                <Card color={C.casa} style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 6, textAlign: 'center' }}>
                    Passe o aparelho para {guesserName}
                  </Text>
                  <Text style={[s.sub, { textAlign: 'center', marginBottom: 14 }]}>
                    A resposta de {subjectName} foi guardada em segredo. Agora é a sua vez de tentar adivinhar!
                  </Text>
                  <Btn t="Estou com o celular" onPress={() => setDuoStep('guesser')} />
                </Card>
              )}

              {duoStep === 'guesser' && (
                <Card color={C.filha}>
                  <Text style={{ fontSize: 12, color: C.filha, fontWeight: '800', textTransform: 'uppercase' }}>
                    Palpite de {guesserName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    O que você acha que {subjectName} escolheu nesta pergunta?
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink, marginBottom: 10 }}>
                    {currentQ.q}
                  </Text>

                  {currentQ.opts.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.inp,
                        tempChoice === i && { borderColor: C.filha, backgroundColor: '#FDF2F4' },
                        { padding: 10, marginBottom: 8 }
                      ]}
                      onPress={() => setTempChoice(i)}
                    >
                      <Text style={{ color: tempChoice === i ? C.filha : C.ink, fontWeight: tempChoice === i ? '700' : '400' }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <Btn t="Confirmar palpite" onPress={handleDuoGuesserConfirm} />
                </Card>
              )}

              {duoStep === 'reveal' && (
                <Card color={duoSubjectChoice === duoGuesserChoice ? C.accent : C.casa}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 8 }}>
                    {duoSubjectChoice === duoGuesserChoice ? 'Sintonia confirmada: vocês acertaram!' : 'Divergência: momento para conversar!'}
                  </Text>

                  <Text style={[s.sub, { fontWeight: '700', marginBottom: 4 }]}>{currentQ.q}</Text>

                  <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.mute }}>{subjectName} escolheu:</Text>
                    <Text style={{ fontWeight: '700', color: C.ink }}>{currentQ.opts[duoSubjectChoice]}</Text>
                  </View>

                  <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: C.mute }}>{guesserName} palpitou:</Text>
                    <Text style={{ fontWeight: '700', color: C.ink }}>{currentQ.opts[duoGuesserChoice]}</Text>
                  </View>

                  <Btn t="Próxima pergunta" onPress={handleDuoNext} />
                </Card>
              )}
            </View>
          )}

          {/* 2. MODO INDIVIDUAL */}
          {mode === 'solo' && (
            <View>
              {soloPhase === 1 && (
                <Card color={C.accent}>
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: '800', textTransform: 'uppercase' }}>
                    Gabarito de {myName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    Responda com sinceridade sobre suas preferências pessoais.
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink, marginBottom: 10 }}>
                    {currentQ.q}
                  </Text>

                  {currentQ.opts.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.inp,
                        tempChoice === i && { borderColor: C.accent, backgroundColor: '#E6F4F1' },
                        { padding: 10, marginBottom: 8 }
                      ]}
                      onPress={() => setTempChoice(i)}
                    >
                      <Text style={{ color: tempChoice === i ? C.accent : C.ink, fontWeight: tempChoice === i ? '700' : '400' }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <Btn t={qIndex + 1 === questions.length ? 'Concluir minhas respostas' : 'Avançar resposta'} onPress={handleSoloConfirm} />
                </Card>
              )}

              {soloPhase === 2 && (
                <Card color={C.casa} style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 6, textAlign: 'center' }}>
                    Passe o aparelho para {partnerName}
                  </Text>
                  <Text style={[s.sub, { textAlign: 'center', marginBottom: 14 }]}>
                    {myName} respondeu todo o questionário. Agora é a vez de {partnerName} tentar acertar o que foi escolhido!
                  </Text>
                  <Btn t="Começar teste de conhecimento" onPress={() => setSoloPhase(3)} />
                </Card>
              )}

              {soloPhase === 3 && (
                <Card color={C.filha}>
                  <Text style={{ fontSize: 12, color: C.filha, fontWeight: '800', textTransform: 'uppercase' }}>
                    Palpite de {partnerName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    O que você acha que {myName} respondeu nesta pergunta?
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink, marginBottom: 10 }}>
                    {currentQ.q}
                  </Text>

                  {currentQ.opts.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.inp,
                        tempChoice === i && { borderColor: C.filha, backgroundColor: '#FDF2F4' },
                        { padding: 10, marginBottom: 8 }
                      ]}
                      onPress={() => setTempChoice(i)}
                    >
                      <Text style={{ color: tempChoice === i ? C.filha : C.ink, fontWeight: tempChoice === i ? '700' : '400' }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <Btn t={qIndex + 1 === questions.length ? 'Finalizar teste e ver sintonia' : 'Confirmar e avançar'} onPress={handleSoloConfirm} />
                </Card>
              )}
            </View>
          )}

          {/* 3. MODO BATE-PRONTO */}
          {mode === 'quick' && (
            <View>
              {quickStep === 1 && (
                <Card color={C.accent}>
                  <Text style={{ fontSize: 12, color: C.accent, fontWeight: '800', textTransform: 'uppercase' }}>
                    Voto de {myName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    Na sua visão sincera, quem mais combina com a situação abaixo?
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 14 }}>
                    {currentQ}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[s.btn, { flex: 1, backgroundColor: C.accent }]}
                      onPress={() => handleQuickVote(myName)}
                    >
                      <Text style={s.btnT}>{myName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.btn, { flex: 1, backgroundColor: C.foco }]}
                      onPress={() => handleQuickVote(partnerName)}
                    >
                      <Text style={s.btnT}>{partnerName}</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {quickStep === 2 && (
                <Card color={C.casa} style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 6, textAlign: 'center' }}>
                    Passe o aparelho para {partnerName}
                  </Text>
                  <Text style={[s.sub, { textAlign: 'center', marginBottom: 14 }]}>
                    O voto de {myName} foi ocultado. Agora {partnerName} vai registrar sua opinião!
                  </Text>
                  <Btn t="Votar agora" onPress={() => setQuickStep(3)} />
                </Card>
              )}

              {quickStep === 3 && (
                <Card color={C.filha}>
                  <Text style={{ fontSize: 12, color: C.filha, fontWeight: '800', textTransform: 'uppercase' }}>
                    Voto de {partnerName}
                  </Text>
                  <Text style={[s.sub, { marginTop: 2, marginBottom: 8 }]}>
                    Na sua visão sincera, quem mais combina com a situação abaixo?
                  </Text>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 14 }}>
                    {currentQ}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[s.btn, { flex: 1, backgroundColor: C.accent }]}
                      onPress={() => handleQuickVote(myName)}
                    >
                      <Text style={s.btnT}>{myName}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.btn, { flex: 1, backgroundColor: C.foco }]}
                      onPress={() => handleQuickVote(partnerName)}
                    >
                      <Text style={s.btnT}>{partnerName}</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              )}

              {quickStep === 4 && (
                <Card color={quickP1Choice === quickP2Choice ? C.accent : C.casa}>
                  <Text style={{ fontWeight: '800', fontSize: 16, color: C.ink, marginBottom: 8 }}>
                    {quickP1Choice === quickP2Choice ? 'Ambos concordam! Sintonia plena.' : 'Houve divergência bem-humorada!'}
                  </Text>

                  <Text style={[s.sub, { fontWeight: '700', marginBottom: 8 }]}>{currentQ}</Text>

                  <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: C.mute }}>{myName} votou em:</Text>
                    <Text style={{ fontWeight: '700', color: C.ink }}>{quickP1Choice}</Text>
                  </View>

                  <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, color: C.mute }}>{partnerName} votou em:</Text>
                    <Text style={{ fontWeight: '700', color: C.ink }}>{quickP2Choice}</Text>
                  </View>

                  <Btn t="Próxima afirmação" onPress={handleQuickNext} />
                </Card>
              )}
            </View>
          )}

          <TouchableOpacity
            style={{ marginTop: 10, alignSelf: 'center' }}
            onPress={() => setPlaying(false)}
          >
            <Text style={{ color: C.mute, fontSize: 13, textDecorationLine: 'underline' }}>
              Pausar ou encerrar partida
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* TELA DE RESULTADO FINAL */}
      {playing && finished && (
        <Card color={C.accent} style={{ marginTop: 8 }}>
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 32, fontWeight: '900', color: C.accent }}>
              {percentage}%
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.ink, marginTop: 4 }}>
              {percentage >= 80 ? 'Sintonia extraordinária' : (percentage >= 50 ? 'Parceria equilibrada' : 'Mundo de novidades a explorar')}
            </Text>
            <Text style={[s.sub, { textAlign: 'center', marginTop: 4, marginHorizontal: 12 }]}>
              {percentage >= 80 && 'Vocês se conhecem nos mínimos detalhes! Uma conexão profunda e cheia de cumplicidade.'}
              {percentage >= 50 && percentage < 80 && 'Vocês têm uma excelente sintonia e ainda contam com muitas conversas prazerosas para descobrir um ao outro.'}
              {percentage < 50 && 'Excelente oportunidade para rir das divergências, conversar com calma e conhecer facetas novas do casal.'}
            </Text>
          </View>

          <Text style={[s.sub, { fontWeight: '700', marginTop: 10, marginBottom: 6 }]}>
            Resumo das perguntas da rodada:
          </Text>

          {answersLog.map((item, idx) => (
            <View key={idx} style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: C.ink }}>{item.q}</Text>
              <Text style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>
                {item.subName}: {item.subAns} | {item.gueName}: {item.gueAns}
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: item.isMatch ? C.accent : C.casa, marginTop: 2 }}>
                {item.isMatch ? 'Acerto de sintonia' : 'Divergência'}
              </Text>
            </View>
          ))}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Btn t="Jogar novamente" onPress={() => startNewGame(mode, qCount)} />
            </View>
            <View style={{ flex: 1 }}>
              <Btn t="Concluir" ghost onPress={() => setPlaying(false)} />
            </View>
          </View>
        </Card>
      )}
    </View>
  );
}

// ─── ABA IDEIAS (REDIRECIONADOR PARA NÓS - SEM REDUNDÂNCIA) ───────────────────
function TabIdeias(props) {
  return <TabNos {...props} />;
}

// ─── ABA NÓS ─────────────────────────────────────────────────────────────────
function TabNos({
  notes, setNotes, saveOfflineCache, cks, setCks, logs, plan, setPlan, cfgDate, hid, uid,
  members, whoOf, effectivePartnerName, cfgSet, wkKey, cfgIdeas
}) {
  const [nt, setNt] = useState('');
  const [ca, setCa] = useState('');
  const [caLoaded, setCaLoaded] = useState(false);

  // Ideias a dois (integradas diretamente em Nós)
  const [ideaCat, setIdeaCat] = useState('casal');
  const [curIdea, setCurIdea] = useState('');
  const [mineIdea, setMineIdea] = useState('');

  const IDEA_CATS = {
    casal: { name: 'Romântico', list: IDEAS_CASAL },
    jogos: { name: 'Jogos e diversão', list: IDEAS_JOGOS },
  };

  const rollIdea = () => {
    const pool = [...IDEA_CATS[ideaCat].list, ...(cfgIdeas?.[ideaCat] || [])];
    let next;
    do {
      next = pool[Math.floor(Math.random() * pool.length)];
    } while (next === curIdea && pool.length > 1);
    setCurIdea(next);
  };

  const proposePlan = async () => {
    if (!curIdea) return;
    const planData = { txt: curIdea, by: uid, at: Date.now() };
    setPlan(planData);
    if (saveOfflineCache) saveOfflineCache({ plan: planData });
    sb.from('config').upsert({ household_id: hid, key: 'plan', value: planData }, { onConflict: 'household_id,key' }).catch(() => {});
    notifyInstant('Combinado em Nós', `Novo combinado do casal: ${curIdea}`);
    Alert.alert('Ideia combinada', 'Essa sugestão foi guardada como o combinado atual do casal.');
  };

  const markPlanDone = async () => {
    setPlan(null);
    if (saveOfflineCache) saveOfflineCache({ plan: null });
    sb.from('config').delete().eq('household_id', hid).eq('key', 'plan').catch(() => {});
    notifyInstant('Combinado em Nós', 'Combinado do casal concluído.');
  };

  const saveMineIdea = async list => {
    const nextCfg = { ...cfgIdeas, [ideaCat]: list };
    await cfgSet('ideas', nextCfg);
  };

  const cfg = cfgDate || { d: 5, t: '20:30' };
  const myAns = cks.find(x => x.by === uid);
  const othAns = cks.find(x => x.by !== uid);

  useEffect(() => {
    if (myAns?.a !== undefined && !caLoaded) {
      setCa(myAns.a || '');
      setCaLoaded(true);
    }
  }, [myAns, caLoaded]);

  const q = CQ[Math.floor(Date.now() / 604800000) % CQ.length];
  const me = logs.filter(x => x.by === uid).length;
  const oth = logs.filter(x => x.by !== uid).length;
  const tot = me + oth;

  const rollDate = async () => {
    const l = [...IDEAS_CASAL, ...IDEAS_JOGOS, ...(cfgIdeas?.casal || []), ...(cfgIdeas?.jogos || [])];
    const t = l[Math.floor(Math.random() * l.length)];
    const planData = { txt: t, by: uid, at: Date.now() };
    setPlan(planData);
    if (saveOfflineCache) saveOfflineCache({ plan: planData });
    sb.from('config').upsert({ household_id: hid, key: 'plan', value: planData }, { onConflict: 'household_id,key' }).catch(() => {});
  };

  const n = new Date();
  const dd = (cfg.d - n.getDay() + 7) % 7;
  const dStr = dd === 0 ? 'hoje' : dd === 1 ? 'amanhã' : 'em ' + dd + ' dias';

  const saveCheckInAnswer = async () => {
    if (!ca.trim()) return;
    const answer = { household_id: hid, wk: wkKey(), by: uid, a: ca.trim() };
    if (setCks) {
      setCks(prev => {
        const next = [...prev.filter(x => !(x.by === uid && x.wk === wkKey())), answer];
        if (saveOfflineCache) saveOfflineCache({ cks: next });
        return next;
      });
    }
    sb.from('checkin').upsert(answer, { onConflict: 'household_id,wk,by' }).catch(() => {});
    notifyInstant('Check-in em Nós', `Sua resposta foi enviada: ${ca.trim()}`);
  };

  return (
    <ScrollView contentContainerStyle={s.pad} showsVerticalScrollIndicator={false}>
      {/* SEÇÃO DE IDEIAS A DOIS */}
      <Text style={s.h2}>Ideias a dois</Text>
      <Text style={s.sub}>Momentos para conectar, relaxar e se divertir juntos.</Text>

      {/* CATEGORIAS DAS IDEIAS */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10, marginTop: 4 }}>
        {Object.keys(IDEA_CATS).map(k => (
          <TouchableOpacity
            key={k}
            style={[s.chipLine, ideaCat === k && { backgroundColor: C.accent }]}
            onPress={() => { setIdeaCat(k); setCurIdea(''); }}
          >
            <Text style={{ fontWeight: '700', fontSize: 13, color: ideaCat === k ? '#fff' : C.ink }}>
              {IDEA_CATS[k].name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={{ marginBottom: 8 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, color: C.ink }}>
          {curIdea || 'Toque em Sortear ideia para ver uma sugestão para vocês dois.'}
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Btn t="Sortear ideia a dois" onPress={rollIdea} />
        {curIdea && (
          <Btn t="Propor como combinado" ghost onPress={proposePlan} />
        )}
      </View>

      {/* COMBINADO ATIVO DO CASAL */}
      {plan?.txt && (
        <Card color={C.filha} style={{ marginBottom: 14 }}>
          <Text style={{ fontWeight: '800' }}>Combinado para nós: {plan.txt}</Text>
          <TouchableOpacity onPress={markPlanDone}>
            <Text style={{ color: C.accent, marginTop: 6, fontWeight: '700' }}>Marcar como feito</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* MINHAS IDEIAS SALVAS */}
      {(cfgIdeas?.[ideaCat] || []).length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <Text style={[s.sub, { fontWeight: '700', color: C.ink }]}>Nossas ideias personalizadas</Text>
          {(cfgIdeas?.[ideaCat] || []).map((t, i) => (
            <View key={i} style={s.taskRow}>
              <Text style={{ flex: 1, fontSize: 14 }}>{t}</Text>
              <TouchableOpacity onPress={() => {
                const list = [...(cfgIdeas?.[ideaCat] || [])];
                list.splice(i, 1);
                saveMineIdea(list);
              }}>
                <Text style={{ color: C.mute, fontSize: 20, padding: 4 }}>x</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        <TextInput
          style={[s.inp, { flex: 1, marginBottom: 0 }]}
          placeholder={`Escrever ideia de ${IDEA_CATS[ideaCat].name.toLowerCase()}`}
          value={mineIdea}
          onChangeText={setMineIdea}
        />
        <TouchableOpacity
          style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]}
          onPress={() => {
            if (!mineIdea.trim()) return;
            saveMineIdea([...(cfgIdeas?.[ideaCat] || []), mineIdea.trim()]);
            setMineIdea('');
          }}
        >
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      {/* JOGO DO CASAL: O QUANTO VOCE ME CONHECE */}
      <JogoDoCasal
        myName={whoOf(uid) || 'Voce'}
        partnerName={effectivePartnerName || 'Parceiro(a)'}
      />

      <Text style={s.h2}>Noite do casal</Text>
      <Card color={C.filha}>
        <Text style={{ fontWeight: '800' }}>Próxima: {DN[cfg.d]}, {cfg.t} ({dStr})</Text>
        {plan?.txt && <Text style={[s.sub, { marginTop: 4, fontWeight: '700', color: C.ink }]}>Ideia combinada: {plan.txt}</Text>}
      </Card>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <Text style={s.sub}>Dia:</Text>
        {DN.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[s.chipLine, cfg.d === i && { backgroundColor: C.accent }]}
            onPress={() => {
              cfgSet('date', { ...cfg, d: i });
              notifyInstant('Noite do casal em Nós', `Data definida para ${DN[i]} às ${cfg.t}.`);
            }}
          >
            <Text style={{ fontWeight: '700', fontSize: 12, color: cfg.d === i ? '#fff' : C.ink }}>{d.slice(0, 3)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Btn t="Sortear ideia para a noite" ghost onPress={rollDate} />

      <Text style={[s.h2, { marginTop: 16 }]}>Bilhetes</Text>
      {notes.map(x => (
        <View key={x.id} style={s.taskRow}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15 }}>{x.txt}</Text>
            <Text style={s.sub}>{x.by === uid ? 'Você' : whoOf(x.by)}</Text>
          </View>
          {x.by === uid && (
            <TouchableOpacity onPress={() => {
              if (setNotes) {
                setNotes(prev => {
                  const next = (prev || []).filter(n => n.id !== x.id);
                  if (saveOfflineCache) saveOfflineCache({ notes: next });
                  return next;
                });
              }
              sb.from('notes').delete().eq('id', x.id).catch(() => {});
            }}>
              <Text style={{ color: C.mute, fontSize: 22, padding: 4 }}>x</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      {notes.length === 0 && <Text style={s.sub}>Nenhum bilhete ainda.</Text>}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TextInput style={[s.inp, { flex: 1, marginBottom: 0 }]} placeholder="Deixe um recado carinhoso" value={nt} onChangeText={setNt} />
        <TouchableOpacity
          style={[s.btn, { marginBottom: 0, paddingHorizontal: 14 }]}
          onPress={() => {
            if (!nt.trim()) return;
            const noteContent = nt.trim();
            const newNote = {
              id: 'note_' + Date.now(),
              household_id: hid,
              txt: noteContent,
              by: uid,
              created_at: new Date().toISOString()
            };
            if (setNotes) {
              setNotes(prev => {
                const next = [newNote, ...(prev || [])];
                if (saveOfflineCache) saveOfflineCache({ notes: next });
                return next;
              });
            }
            sb.from('notes').insert(newNote).catch(() => {});
            notifyInstant('Bilhete em Nós', `Novo bilhete: "${noteContent}"`);
            setNt('');
          }}
        >
          <Text style={s.btnT}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.h2, { marginTop: 16 }]}>Check-in da semana</Text>
      <Card><Text style={{ fontWeight: '800' }}>{q}</Text></Card>
      <TextInput
        style={s.inp}
        placeholder="Sua resposta..."
        value={ca}
        onChangeText={setCa}
        onEndEditing={saveCheckInAnswer}
      />
      {othAns && <Card><Text style={{ fontWeight: '800' }}>{effectivePartnerName || 'Parceiro(a)'}:</Text><Text>{othAns.a}</Text></Card>}

      <Text style={[s.h2, { marginTop: 16 }]}>Carga da semana</Text>
      <Card>
        <Text style={{ fontWeight: '800' }}>Eu: {me} · {effectivePartnerName || 'Parceiro(a)'}: {oth}</Text>
        <Text style={s.sub}>{tot < 6 ? 'Os números aparecem conforme vocês marcam tarefas e o cuidado infantil.' : (Math.max(me, oth) / tot > 0.65 ? 'A divisão está desigual. Vale uma conversa.' : 'A divisão está equilibrada.')}</Text>
      </Card>

      <Btn t="Sair da conta" ghost onPress={() => { Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}); sb.auth.signOut(); }} />
    </ScrollView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: C.bg },
  pad:      { padding: 16, paddingBottom: 40 },
  h1:       { fontSize: 20, fontWeight: '800', color: C.ink },
  h2:       { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 6 },
  sub:      { color: C.mute, fontSize: 13, marginBottom: 4 },
  inp:      { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 15, color: C.ink },
  btn:      { backgroundColor: C.accent, borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 10 },
  ghost:    { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.accent },
  btnT:     { color: '#fff', fontWeight: '800', fontSize: 15 },
  card:     {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  chip:     { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  chipLine: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#DCE4E8', backgroundColor: '#FFFFFF' },
  note:     { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingVertical: 4, fontSize: 14, color: C.ink },
  hr:       { width: 34, fontWeight: '800', color: C.mute, paddingTop: 8, fontSize: 13 },
  taskRow:  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  // CABEÇALHO
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: STATUS_BAR_HEIGHT + 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF0',
    backgroundColor: C.card,
  },
  burgerBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  burgerLine: {
    width: 18,
    height: 2,
    backgroundColor: C.ink,
    borderRadius: 2,
    marginVertical: 2,
  },
  headerInviteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: '#DCE4E8',
  },
  headerInviteTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
  },
  headerConnectedBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  headerConnectedTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  headerPrivatePill: {
    backgroundColor: '#F3E5F5',
    borderWidth: 1,
    borderColor: '#E1BEE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  headerPrivateTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E44AD',
  },

  // BARRA SUPERIOR DA AGENDA E SEGMENTED CONTROL
  agendaTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
  },
  segmentedBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  segmentedBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  segmentedTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.mute,
  },
  segmentedTxtActive: {
    fontWeight: '700',
    color: C.ink,
  },
  settingsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4E8',
  },
  settingsBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
  },

  // CARD "AGORA"
  nowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    padding: 14,
    marginBottom: 12,
  },
  nowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.ink,
  },
  nowBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nowBadgeTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.mute,
  },
  nowPersonBox: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  nowPersonLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  nowActivityTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.ink,
  },
  nowSubTxt: {
    fontSize: 12,
    color: C.mute,
    marginTop: 2,
  },

  // FILTROS EM PÍLULA
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE4E8',
  },
  filterPillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  filterPillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: C.ink,
  },
  filterPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // LINHA DE CADA HORÁRIO NA AGENDA
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  slotRowCurrent: {
    borderColor: C.accent,
    backgroundColor: '#F4FAF8',
  },
  slotTimeCol: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotHourTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.mute,
  },
  slotHourTxtCurrent: {
    color: C.accent,
    fontWeight: '800',
  },
  slotActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },
  slotChevron: {
    fontSize: 16,
    color: '#94A3B8',
    paddingLeft: 6,
  },
  slotNoteTxt: {
    fontSize: 12,
    color: C.mute,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // BADGES E PÍLULAS DE ATIVIDADE
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgePillTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotMealPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  slotMealPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  agendaAlimentarBtn: {
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    alignItems: 'center',
  },
  agendaAlimentarBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  modalMealBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalMealBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  careMealBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginLeft: 8,
  },
  careMealBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2E7D32',
  },
  alimentarBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: 12,
    marginBottom: 12,
  },
  alimentarBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1B5E20',
    marginBottom: 4,
  },
  alimentarBannerTxt: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 8,
  },
  alimentarBtnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  alimentarQuickBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  alimentarQuickBtnTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // MODAIS (SLOT EDIT E CONFIG)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    elevation: 20,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF0',
    paddingBottom: 10,
  },
  modalSheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.ink,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseTxt: {
    fontSize: 18,
    fontWeight: '700',
    color: C.mute,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: C.ink,
    marginBottom: 8,
  },

  modalFullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF0',
    backgroundColor: '#FFFFFF',
  },
  modalFullscreenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
  },
  modalFullscreenClose: {
    padding: 6,
  },
  modalFullscreenCloseTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.accent,
  },
  configSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    padding: 14,
    marginBottom: 12,
  },

  // CARD POMODORO
  pomodoroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6ECF0',
    padding: 14,
    marginBottom: 10,
  },

  // MENU LATERAL
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerContent: {
    width: '78%',
    maxWidth: 310,
    height: '100%',
    backgroundColor: C.card,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: STATUS_BAR_HEIGHT + 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  drawerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.ink,
  },
  drawerCloseBtn: {
    padding: 6,
  },
  drawerCloseTxt: {
    fontSize: 20,
    fontWeight: '700',
    color: C.mute,
  },
  drawerSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: C.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  privateBadge: {
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  privateBadgeTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E44AD',
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginHorizontal: 10,
    marginVertical: 2,
    borderRadius: 10,
  },
  drawerItemActive: {
    backgroundColor: '#E8F3F1',
  },
  drawerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  drawerItemTxt: {
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
  },
  drawerItemTxtActive: {
    fontWeight: '800',
    color: C.accent,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: C.line,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  drawerCodeBox: {
    backgroundColor: C.bg,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  drawerCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.mute,
    textTransform: 'uppercase',
  },
  drawerCodeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: C.ink,
    letterSpacing: 1,
    marginVertical: 2,
  },
  drawerCodeSub: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '600',
  },
  drawerReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  drawerLogoutBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E57373',
  },
  drawerLogoutTxt: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 14,
  },

  // CARDÁPIO DO MANJAR NA ABA CASA
  mealSectionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 14,
    marginBottom: 14,
  },
  mealSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  mealSectionBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mealSectionDesc: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 10,
  },
  mealDayRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  mealDayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  mealDayChipActive: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  mealDayChipTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  mealDayChipTxtActive: {
    color: '#FFFFFF',
  },
  mealDishRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  mealDishBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  mealDishType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  mealDishName: {
    fontSize: 13,
    color: C.ink,
    lineHeight: 18,
  },

  // ARRUMAÇÃO DA CASA (CÔMODOS SEM SOBRECARGA)
  roomFocusCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  roomFocusTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#92400E',
  },
  roomMinutesBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomMinutesTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  roomFocusDesc: {
    fontSize: 13,
    color: '#78350F',
    marginVertical: 4,
    lineHeight: 18,
  },
  roomCheckItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 2,
  },
  roomCheckBullet: {
    fontSize: 14,
    color: '#B45309',
    fontWeight: '800',
  },
  roomCheckText: {
    fontSize: 13,
    color: C.ink,
    flex: 1,
    lineHeight: 18,
  },
  divisionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  divisionChipSelected: {
    backgroundColor: C.casa,
    borderColor: C.casa,
  },
  divisionChipToday: {
    borderColor: C.casa,
    borderWidth: 1.5,
  },
  divisionChipDay: {
    fontSize: 11,
    fontWeight: '700',
    color: C.mute,
  },
  divisionChipName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.ink,
    marginVertical: 2,
  },
  divisionChipMin: {
    fontSize: 11,
    color: C.mute,
  },

  // NAVEGADOR DINÂMICO DE DATA NA ABA CELINE
  dateNavCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  dateNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateNavArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateNavArrowTxt: {
    fontSize: 22,
    fontWeight: '700',
    color: C.ink,
    marginTop: -2,
  },
  dateNavTitleBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  dateNavMainTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.ink,
    textAlign: 'center',
  },
  dateNavTodayPill: {
    marginTop: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  dateNavTodayPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
  },
  weekStripRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  weekDayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekDayPillActive: {
    backgroundColor: C.filha,
    borderColor: C.filha,
  },
  weekDayPillTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: C.mute,
  },
  weekDayPillTxtActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
