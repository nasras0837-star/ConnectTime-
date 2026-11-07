export type LanguageCode = "en" | "es" | "fr" | "ar" | "pt" | "hi";

export const languages: { code: LanguageCode; label: string; native: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "es", label: "Spanish", native: "Español", dir: "ltr" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
];

export const messages: Record<LanguageCode, Record<string, string>> = {
  en: {
    home:"Home", friends:"Friends", requests:"Friend Requests", messages:"Messages", videoChat:"Video Chat",
    dating:"Dating · 18+", marketplace:"Marketplace", forums:"Forums", chatRooms:"Chat Rooms", blogs:"Blogs",
    videoTube:"ConnectTime Video Tube", news:"News & Stories", events:"Events", createPost:"Create a Post", live:"Live",
    advertise:"Advertise", login:"Log in", joinFree:"Join free ↗", search:"Search people, posts, groups…",
    welcome:"Welcome to ConnectTime", communityStarts:"Your community starts here", createProfile:"Create your profile →",
    oneWorld:"ONE WORLD. MILLIONS OF POSSIBILITIES.", heroLine1:"Whatever you’re into,", heroLine2:"there’s room for it.",
    intro:"Meet people across countries and cultures, explore dating, shop the marketplace, join forums, and enjoy videos and creator media. Share your passions, discover new perspectives, and find your people—wherever in the world they may be.",
    freeProfile:"Create your free profile ↗", exploreVideo:"Explore ConnectTime Video Tube", community:"YOUR COMMUNITY",
    latestConversations:"Latest conversations", forYou:"For you", sampleNotice:"You’re viewing a design preview with sample community posts. Accounts, posting, messaging, marketplace transactions, and live features will be enabled as the platform’s backend and safety systems are completed.",
    language:"Language", languageSaved:"Your language choice is saved on this device."
  },
  es: {
    home:"Inicio", friends:"Amigos", requests:"Solicitudes de amistad", messages:"Mensajes", videoChat:"Videollamada",
    dating:"Citas · 18+", marketplace:"Mercado", forums:"Foros", chatRooms:"Salas de chat", blogs:"Blogs",
    videoTube:"ConnectTime Video Tube", news:"Noticias e historias", events:"Eventos", createPost:"Crear publicación", live:"En vivo",
    advertise:"Anunciarse", login:"Iniciar sesión", joinFree:"Únete gratis ↗", search:"Buscar personas, publicaciones y grupos…",
    welcome:"Te damos la bienvenida a ConnectTime", communityStarts:"Tu comunidad comienza aquí", createProfile:"Crea tu perfil →",
    oneWorld:"UN MUNDO. MILLONES DE POSIBILIDADES.", heroLine1:"Sea lo que sea que te guste,", heroLine2:"hay un lugar para ti.",
    intro:"Conoce personas de distintos países y culturas, explora citas, compra en el mercado, únete a foros y disfruta de videos y contenido de creadores. Comparte tus pasiones y encuentra a tu gente en cualquier parte del mundo.",
    freeProfile:"Crea tu perfil gratis ↗", exploreVideo:"Explorar ConnectTime Video Tube", community:"TU COMUNIDAD",
    latestConversations:"Conversaciones recientes", forYou:"Para ti", sampleNotice:"Estás viendo una vista previa con publicaciones de ejemplo. Las cuentas, publicaciones, mensajes, compras y funciones en vivo se habilitarán cuando estén listos los sistemas de backend y seguridad.",
    language:"Idioma", languageSaved:"Tu idioma se guarda en este dispositivo."
  },
  fr: {
    home:"Accueil", friends:"Amis", requests:"Demandes d’amis", messages:"Messages", videoChat:"Appel vidéo",
    dating:"Rencontres · 18+", marketplace:"Marketplace", forums:"Forums", chatRooms:"Salons de discussion", blogs:"Blogs",
    videoTube:"ConnectTime Video Tube", news:"Actualités et récits", events:"Événements", createPost:"Créer une publication", live:"En direct",
    advertise:"Publicité", login:"Connexion", joinFree:"Inscription gratuite ↗", search:"Rechercher des personnes, publications, groupes…",
    welcome:"Bienvenue sur ConnectTime", communityStarts:"Votre communauté commence ici", createProfile:"Créer votre profil →",
    oneWorld:"UN MONDE. DES MILLIONS DE POSSIBILITÉS.", heroLine1:"Quels que soient vos centres d’intérêt,", heroLine2:"vous avez votre place ici.",
    intro:"Rencontrez des personnes de différents pays et cultures, découvrez les rencontres, le marketplace, les forums, les vidéos et les créateurs. Partagez vos passions et trouvez votre communauté partout dans le monde.",
    freeProfile:"Créer votre profil gratuitement ↗", exploreVideo:"Découvrir ConnectTime Video Tube", community:"VOTRE COMMUNAUTÉ",
    latestConversations:"Dernières conversations", forYou:"Pour vous", sampleNotice:"Vous consultez un aperçu avec des publications fictives. Les comptes, publications, messages, achats et fonctions en direct seront activés lorsque le backend et les systèmes de sécurité seront prêts.",
    language:"Langue", languageSaved:"Votre langue est enregistrée sur cet appareil."
  },
  ar: {
    home:"الرئيسية", friends:"الأصدقاء", requests:"طلبات الصداقة", messages:"الرسائل", videoChat:"محادثة فيديو",
    dating:"التعارف · 18+", marketplace:"السوق", forums:"المنتديات", chatRooms:"غرف الدردشة", blogs:"المدونات",
    videoTube:"ConnectTime Video Tube", news:"الأخبار والقصص", events:"الفعاليات", createPost:"إنشاء منشور", live:"مباشر",
    advertise:"الإعلان", login:"تسجيل الدخول", joinFree:"انضم مجانًا ↗", search:"ابحث عن أشخاص ومنشورات ومجموعات…",
    welcome:"مرحبًا بك في ConnectTime", communityStarts:"مجتمعك يبدأ من هنا", createProfile:"أنشئ ملفك الشخصي →",
    oneWorld:"عالم واحد. ملايين الاحتمالات.", heroLine1:"مهما كانت اهتماماتك،", heroLine2:"هناك مكان لك هنا.",
    intro:"تعرّف على أشخاص من بلدان وثقافات مختلفة، واكتشف المواعدة والسوق والمنتديات ومقاطع الفيديو ومحتوى المبدعين. شارك شغفك واعثر على مجتمعك في أي مكان حول العالم.",
    freeProfile:"أنشئ ملفك مجانًا ↗", exploreVideo:"استكشف ConnectTime Video Tube", community:"مجتمعك",
    latestConversations:"أحدث المحادثات", forYou:"لك", sampleNotice:"أنت تشاهد معاينة تصميم تحتوي على منشورات تجريبية. سيتم تفعيل الحسابات والمنشورات والرسائل والمشتريات والميزات المباشرة بعد اكتمال الأنظمة الخلفية وأنظمة السلامة.",
    language:"اللغة", languageSaved:"يتم حفظ اختيار اللغة على هذا الجهاز."
  },
  pt: {
    home:"Início", friends:"Amigos", requests:"Solicitações de amizade", messages:"Mensagens", videoChat:"Videochamada",
    dating:"Relacionamentos · 18+", marketplace:"Marketplace", forums:"Fóruns", chatRooms:"Salas de bate-papo", blogs:"Blogs",
    videoTube:"ConnectTime Video Tube", news:"Notícias e histórias", events:"Eventos", createPost:"Criar publicação", live:"Ao vivo",
    advertise:"Anunciar", login:"Entrar", joinFree:"Cadastre-se grátis ↗", search:"Buscar pessoas, publicações e grupos…",
    welcome:"Boas-vindas ao ConnectTime", communityStarts:"Sua comunidade começa aqui", createProfile:"Crie seu perfil →",
    oneWorld:"UM MUNDO. MILHÕES DE POSSIBILIDADES.", heroLine1:"Seja qual for seu interesse,", heroLine2:"há espaço para você.",
    intro:"Conheça pessoas de diferentes países e culturas, explore relacionamentos, compre no marketplace, participe de fóruns e aproveite vídeos e conteúdo de criadores. Compartilhe suas paixões e encontre sua comunidade no mundo todo.",
    freeProfile:"Crie seu perfil grátis ↗", exploreVideo:"Explore o ConnectTime Video Tube", community:"SUA COMUNIDADE",
    latestConversations:"Conversas recentes", forYou:"Para você", sampleNotice:"Você está vendo uma prévia com publicações de exemplo. Contas, publicações, mensagens, compras e recursos ao vivo serão ativados quando o backend e os sistemas de segurança estiverem prontos.",
    language:"Idioma", languageSaved:"Sua escolha de idioma fica salva neste dispositivo."
  },
  hi: {
    home:"होम", friends:"दोस्त", requests:"दोस्ती के अनुरोध", messages:"संदेश", videoChat:"वीडियो चैट",
    dating:"डेटिंग · 18+", marketplace:"मार्केटप्लेस", forums:"फ़ोरम", chatRooms:"चैट रूम", blogs:"ब्लॉग",
    videoTube:"ConnectTime Video Tube", news:"समाचार और कहानियाँ", events:"कार्यक्रम", createPost:"पोस्ट बनाएँ", live:"लाइव",
    advertise:"विज्ञापन", login:"लॉग इन", joinFree:"मुफ़्त जुड़ें ↗", search:"लोग, पोस्ट और समूह खोजें…",
    welcome:"ConnectTime में आपका स्वागत है", communityStarts:"आपका समुदाय यहाँ से शुरू होता है", createProfile:"अपनी प्रोफ़ाइल बनाएँ →",
    oneWorld:"एक दुनिया। लाखों संभावनाएँ।", heroLine1:"आपकी रुचि चाहे जो भी हो,", heroLine2:"यहाँ आपके लिए जगह है।",
    intro:"अलग-अलग देशों और संस्कृतियों के लोगों से मिलें, डेटिंग देखें, मार्केटप्लेस में खरीदारी करें, फ़ोरम से जुड़ें और वीडियो व क्रिएटर सामग्री का आनंद लें। अपने शौक साझा करें और दुनिया में कहीं भी अपने लोग खोजें।",
    freeProfile:"अपनी मुफ़्त प्रोफ़ाइल बनाएँ ↗", exploreVideo:"ConnectTime Video Tube देखें", community:"आपका समुदाय",
    latestConversations:"हाल की बातचीत", forYou:"आपके लिए", sampleNotice:"आप उदाहरण पोस्ट वाला डिज़ाइन प्रीव्यू देख रहे हैं। अकाउंट, पोस्ट, संदेश, खरीदारी और लाइव सुविधाएँ बैकएंड और सुरक्षा प्रणालियाँ पूरी होने पर चालू होंगी।",
    language:"भाषा", languageSaved:"आपकी भाषा इस डिवाइस पर सहेजी जाती है।"
  },
};
