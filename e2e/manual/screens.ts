/**
 * Lista canônica das telas do manual do usuário (TCK-0024).
 *
 * Tudo aqui é declarativo: id, caminho, texto e como deixar a tela pronta. Tela
 * nova no app entra como uma entrada nova — o `capture.ts` não muda. Tela que
 * existe no app e não está nesta lista é defeito de cobertura, não omissão
 * aceitável (regra da skill `/user-manual`).
 *
 * Os textos são a fonte do capítulo em pt-BR. Revisão de texto se faz aqui e se
 * regenera; editar `docs/user-manual/*.md` à mão é perder o trabalho na próxima
 * execução.
 */

export interface Screen {
  /** Usado no nome do arquivo e na ordenação dos capítulos. */
  id: string;
  /** Caminho, já com `{locale}` interpolado pelo capturador. */
  path: string;
  /** Título do capítulo (pt-BR). */
  title: string;
  /** O que a tela é, em uma ou duas frases. */
  purpose: string;
  /** O que a pessoa consegue fazer ali. Vira lista no capítulo. */
  actions: string[];
  /** Seletor que só existe quando a tela terminou de carregar. */
  readySelector: string;
  /** Precisa de sessão iniciada. */
  requiresAuth?: boolean;
  /**
   * Cliques a dar antes da foto — para painéis que vivem atrás de uma aba.
   * Seletor posicional de propósito: rótulo muda com o idioma, posição não.
   */
  clicks?: string[];
}

export const SCREENS: Screen[] = [
  {
    id: 'landing',
    path: '/{locale}',
    title: 'Página inicial',
    purpose:
      'A porta de entrada do ligcentro. Apresenta a proposta — uma única URL que reúne todos os seus links — e leva ao cadastro.',
    actions: [
      'Ler o que o ligcentro faz antes de criar conta',
      'Ir para o cadastro pelo botão principal',
      'Ver um perfil de exemplo em funcionamento',
    ],
    readySelector: 'h1',
  },
  {
    id: 'signup',
    path: '/{locale}/signup',
    title: 'Criar conta',
    purpose:
      'Onde a conta nasce. Na mesma tela ficam os dois caminhos: e-mail e senha, ou entrar direto com Google ou GitHub — sem precisar navegar para outra página.',
    actions: [
      'Criar conta com e-mail, senha e o handle desejado',
      'Ver na hora se o handle está disponível, enquanto digita',
      'Criar conta com Google ou com GitHub, sem preencher formulário',
      'Ir para a tela de login, se a conta já existir',
    ],
    readySelector: 'form',
  },
  {
    id: 'login',
    path: '/{locale}/login',
    title: 'Entrar',
    purpose: 'Retorno de quem já tem conta, pelos mesmos caminhos do cadastro.',
    actions: [
      'Entrar com e-mail e senha',
      'Entrar com Google ou GitHub',
      'Ir para o cadastro, se ainda não tiver conta',
    ],
    readySelector: 'form',
  },
  {
    id: 'onboarding',
    path: '/{locale}/onboarding?step=1',
    title: 'Primeiros passos',
    purpose:
      'O guia que aparece logo após o cadastro e leva do zero ao primeiro perfil publicado em poucos passos.',
    actions: [
      'Preencher nome e bio do perfil',
      'Adicionar os primeiros links',
      'Concluir e cair no editor completo',
    ],
    readySelector: 'h1',
    requiresAuth: true,
  },
  {
    id: 'dashboard-profile',
    path: '/{locale}/dashboard',
    title: 'Editor — Perfil',
    purpose:
      'O centro do produto. A aba Perfil controla como você aparece: foto, nome exibido e bio.',
    actions: [
      'Enviar ou trocar a foto de perfil',
      'Editar o nome exibido e a bio',
      'Publicar ou despublicar a página',
      'Abrir a página pública e compartilhar o QR code',
    ],
    readySelector: 'nav[aria-label]',
    requiresAuth: true,
  },
  {
    id: 'dashboard-blocks',
    path: '/{locale}/dashboard',
    title: 'Editor — Blocos',
    purpose:
      'A lista de blocos é o conteúdo da sua página: links, redes sociais e formas de contato, na ordem que você definir.',
    actions: [
      'Criar bloco de link, de rede social ou de contato',
      'Reordenar arrastando',
      'Agendar um link para aparecer ou sumir em uma data',
      'Editar ou remover um bloco existente',
    ],
    readySelector: 'nav[aria-label]',
    requiresAuth: true,
    clicks: ['nav > button:nth-of-type(2)'],
  },
  {
    id: 'dashboard-themes',
    path: '/{locale}/dashboard',
    title: 'Editor — Temas',
    purpose:
      'A aparência da página pública: temas prontos e ajuste fino de cor de fundo, cor de botão, fonte e formato dos botões.',
    actions: [
      'Escolher um tema pronto',
      'Ajustar cor de fundo e cor dos botões',
      'Trocar a fonte e o formato dos botões',
      'Usar as cores oficiais de cada rede nos botões sociais',
    ],
    readySelector: 'nav[aria-label]',
    requiresAuth: true,
    clicks: ['nav > button:nth-of-type(3)'],
  },
  {
    id: 'dashboard-account',
    path: '/{locale}/dashboard',
    title: 'Editor — Meus dados',
    purpose:
      'Seus direitos sobre os próprios dados: exportar tudo o que o ligcentro guarda ou apagar a conta de vez.',
    actions: [
      'Exportar o perfil e os blocos em JSON',
      'Excluir a conta e todos os dados associados',
    ],
    readySelector: 'nav[aria-label]',
    requiresAuth: true,
    clicks: ['nav > button:nth-of-type(4)'],
  },
  {
    id: 'analytics',
    path: '/{locale}/dashboard/analytics',
    title: 'Analytics',
    purpose:
      'Quantas visitas e cliques sua página recebeu, e quais links funcionam melhor. Os números são agregados e não identificam quem visitou.',
    actions: [
      'Ver visitas, cliques e taxa de clique do período',
      'Acompanhar a evolução diária no gráfico',
      'Descobrir os blocos com mais cliques',
    ],
    readySelector: 'h1',
    requiresAuth: true,
  },
  {
    id: 'public-profile',
    path: '/{locale}/demo',
    title: 'Página pública',
    purpose:
      'O que o mundo vê quando abre o seu link. Carrega rápido, funciona bem no celular e usa o tema que você escolheu.',
    actions: [
      'Abrir qualquer um dos seus links',
      'Entrar em contato pelos blocos de contato',
      'Compartilhar o endereço ou o QR code da página',
    ],
    readySelector: 'h1',
  },
];
