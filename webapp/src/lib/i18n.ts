/**
 * Lingwa — Internationalization (i18n)
 *
 * Simple key-based translation system.
 * All UI strings resolve to the user's native language.
 *
 * Usage:
 *   import { t } from '@/lib/i18n'
 *   const nativeLang = getNativeLang()  // from resolve.ts
 *   t('sayThis', nativeLang)            // → "说这个："
 */

const translations: Record<string, Record<string, string>> = {
  // ─── English (default fallback) ───
  en: {
    // VoiceChat
    sayThis: 'Say this:',
    tapToSpeak: 'Tap to speak',
    tapToStop: 'Tap to stop',
    analysing: 'Analysing...',
    analysingYourSpeech: 'Analysing your speech...',
    isSpeaking: '{name} is speaking...',
    isThinking: '{name} is thinking...',
    isListening: 'Listening...',
    replay: 'Replay',
    lessonComplete: 'Lesson Complete!',
    isProudOfYou: '{name} is proud of you!',
    whatYouPracticed: 'What you practiced:',
    tryAgain: 'Try again!',
    greatNowTry: 'Great! Now try: "{phrase}"',
    connectionIssue: 'Connection issue — tap mic and try again',
    micError: "Couldn't access your microphone. Check browser permissions",
    somethingWrong: 'Something went wrong — try again',
    practice: 'Practice: {title}',

    // LessonTeach
    lessonVocabulary: 'Lesson vocabulary',
    noVocabulary: 'No vocabulary for this lesson yet.',
    startQuiz: 'Start Quiz',
    next: 'Next',
    back: 'Back',
    skipToQuiz: 'Skip to quiz',
    tapToListen: 'Tap to listen',
    heardIt: 'Heard it',
    tone: '{tone} tone',

    // ExerciseCard
    tapToHear: 'Tap to hear',
    whatDoesThisMean: 'What does this mean?',
    answer: 'Answer:',
    listenAgain: 'Listen again',
    correct: 'Correct!',
    notQuite: 'Not quite',
    completeLesson: 'Complete Lesson',
    continue: 'Continue',

    // LessonTree
    noCurriculum: 'No curriculum yet',
    completeOnboarding: 'Complete onboarding to generate your personalized curriculum.',
    startOnboarding: 'Start onboarding',
    unitLabel: 'Unit {num}: {title}',
    lessonsProgress: '{completed}/{total} lessons',
    start: 'Start',

    // Level selector
    levelA1: 'Beginner',
    levelA2: 'Elementary',
    levelB1: 'Intermediate',
    levelB2: 'Upper Intermediate',
    skipToLevel: 'Skip to {level}?',
    skipToLevelDesc: 'This will mark previous levels as complete and start you at {level}.',
    skipConfirm: 'Yes, I know the basics',

    // Course page
    yourAiTutor: 'Your AI tutor',
    completeUnitToUnlock: 'Complete a unit to unlock free chat',
    course: 'Course',
    conversationPractice: 'Conversation Practice',
    unitChat: 'Unit {num} Chat — Practice with {name}',
    completeUnitToUnlockN: 'Complete Unit {num} to unlock',
    willQuizYou: '{name} will quiz you on Unit {num} vocabulary',
    finalChallenge: 'Final Challenge — {name} covers everything!',
    completeAllUnits: 'Complete all {num} units to unlock Final Challenge',
    comprehensiveTest: 'Comprehensive test — no hints, no phrases',
    curriculumComplete: 'Curriculum complete!',
    masteredLevel: "You've mastered the {level} curriculum. Congratulations!",
    levelComplete: '{level} complete!',
    finishedAllUnits: "You've finished all {level} units. {next} course coming soon.",

    // Home page
    learnAnyLanguage: 'Learn any language.',
    builtForYou: 'Built just for you.',
    heroDesc: 'Curated courses with AI conversation practice. Runs locally with Ollama. Free forever.',
    level: 'Level {level}',
    lessonsCompleted: '{count} lesson completed',
    lessonsCompletedPlural: '{count} lessons completed',
    continueLearning: 'Continue learning {lang}',
    changeLanguage: 'Change language / Reset',
    resetConfirm: 'This will delete your profile and curriculum. Are you sure?',
    cancel: 'Cancel',
    reset: 'Reset',
    featureCurated: 'Curated courses — start learning in 5 seconds',
    featureChat: 'Real AI conversation practice after every unit',
    featureLocal: 'Runs 100% locally — your data never leaves your machine',
    featureFree: 'No account needed · No subscription · Free forever',
    startLearning: 'Start learning',
    freeOpenSource: 'Free · Open source · No account needed',

    // Lesson page
    loadingLesson: 'Loading lesson...',
    lessonNotFound: 'Lesson not found',
    speakWith: 'Speak with {name}',

    // VoiceChat opening messages
    openingPractice: 'Hi! I\'m {name} 😊 Let\'s practice! Try saying: "{phrase}" — I\'ll listen and help you get it right! Tap the mic when you\'re ready 🎙️',
    openingUnitChat: 'Hi! I\'m {name} 😊 Congrats on finishing Unit {unit}! Let\'s have a real conversation using what you\'ve learned. Just talk to me naturally — no pressure!',
    openingFinalChallenge: 'Hi! I\'m {name} 😊 Welcome to your Final Challenge! We\'ll cover everything from all units. No hints — just talk! Ready? 🏆',
    couldntHear: "I couldn't hear you clearly. Try speaking closer to the mic 🎤",
    rightWordParticle: 'Right word! Don\'t forget {particle} at the end — try: {expected}',

    // Onboarding
    yourLanguage: 'Your language?',
    pickNativeLang: "Pick the language you speak — we'll teach you in it.",
    whatToLearn: 'What language do you want to learn?',
    pickTargetLang: 'Pick a language — your course starts instantly.',
    whatsYourLevel: "What's your {lang} level?",
    beHonest: 'Be honest — the right starting point makes everything easier.',
    yourGender: 'Your gender?',
    genderExplain: '{lang} uses different words depending on the speaker\'s gender. This affects your lessons.',
    letsGo: "Let's go!",
    loadingCourse: 'Loading your {lang} course...',
    loadingCourses: 'Loading courses...',
    stepOf: 'Step {current} of {total}',
    completeBeginner: 'Complete beginner',
    knowZeroWords: 'I know zero words',
    knowBasics: 'Know a few basics',
    canSayHello: 'Can say hello and numbers',
    male: 'Male',
    female: 'Female',
    showBoth: 'Show me both',
    noCourses: 'No courses found. Make sure course files exist in languages/*/courses/',

    // Exercise instructions
    whatDoYouHear: 'What do you hear?',
    tapMatchingPairs: 'Tap the matching pairs',
    tapWordsBuild: 'Tap words to build the sentence',
    check: 'Check',
    correctOrder: 'Correct order:',
    hearCorrectSentence: 'Hear the correct sentence',
  },

  // ─── Chinese Simplified ───
  zh: {
    // VoiceChat
    sayThis: '说这个：',
    tapToSpeak: '点击说话',
    tapToStop: '点击停止',
    analysing: '分析中...',
    analysingYourSpeech: '正在分析你的发音...',
    isSpeaking: '{name}正在说话...',
    isThinking: '{name}正在思考...',
    isListening: '正在听...',
    replay: '重放',
    lessonComplete: '课程完成！',
    isProudOfYou: '{name}为你骄傲！',
    whatYouPracticed: '你练习了：',
    tryAgain: '再试一次！',
    greatNowTry: '很好！现在试试："{phrase}"',
    connectionIssue: '连接出错——再试一次',
    micError: '无法访问麦克风，请检查浏览器权限',
    somethingWrong: '出了点问题——再试一次',
    practice: '练习：{title}',

    // LessonTeach
    lessonVocabulary: '课程词汇',
    noVocabulary: '本课暂无词汇。',
    startQuiz: '开始测验',
    next: '下一个',
    back: '返回',
    skipToQuiz: '跳到测验',
    tapToListen: '点击收听',
    heardIt: '听过了',
    tone: '{tone}声',

    // ExerciseCard
    tapToHear: '点击收听',
    whatDoesThisMean: '这是什么意思？',
    answer: '答案：',
    listenAgain: '再听一次',
    correct: '正确！',
    notQuite: '不太对',
    completeLesson: '完成课程',
    continue: '继续',

    // LessonTree
    noCurriculum: '还没有课程',
    completeOnboarding: '完成设置以生成个性化课程。',
    startOnboarding: '开始设置',
    unitLabel: '第{num}单元：{title}',
    lessonsProgress: '{completed}/{total}课',
    start: '开始',

    // Level selector
    levelA1: '初级',
    levelA2: '基础',
    levelB1: '中级',
    levelB2: '中高级',
    skipToLevel: '跳到{level}？',
    skipToLevelDesc: '这将标记之前的级别为已完成，从{level}开始。',
    skipConfirm: '是的，我已有基础',

    // Course page
    yourAiTutor: '你的AI导师',
    completeUnitToUnlock: '完成单元解锁自由对话',
    course: '课程',
    conversationPractice: '会话练习',
    unitChat: '第{num}单元对话——和{name}练习',
    completeUnitToUnlockN: '完成第{num}单元解锁',
    willQuizYou: '{name}将考你第{num}单元的词汇',
    finalChallenge: '终极挑战——{name}全面测试！',
    completeAllUnits: '完成全部{num}个单元解锁终极挑战',
    comprehensiveTest: '综合测试——没有提示',
    curriculumComplete: '课程全部完成！',
    masteredLevel: '你已掌握{level}课程。恭喜！',
    levelComplete: '{level}完成！',
    finishedAllUnits: '你已完成所有{level}单元。{next}课程即将推出。',

    // Home page
    learnAnyLanguage: '学习任何语言。',
    builtForYou: '专为你打造。',
    heroDesc: 'AI对话练习的精选课程。本地运行Ollama。永久免费。',
    level: '{level}级',
    lessonsCompleted: '已完成{count}课',
    lessonsCompletedPlural: '已完成{count}课',
    continueLearning: '继续学习{lang}',
    changeLanguage: '更换语言 / 重置',
    resetConfirm: '这将删除你的档案和课程。确定吗？',
    cancel: '取消',
    reset: '重置',
    featureCurated: '精选课程——5秒开始学习',
    featureChat: '每个单元后进行真实AI对话练习',
    featureLocal: '100%本地运行——你的数据永远不会离开你的设备',
    featureFree: '无需账户 · 无需订阅 · 永久免费',
    startLearning: '开始学习',
    freeOpenSource: '免费 · 开源 · 无需账户',

    // Lesson page
    loadingLesson: '加载课程中...',
    lessonNotFound: '找不到课程',
    speakWith: '和{name}对话',

    // VoiceChat opening messages
    openingPractice: '你好！我是{name} 😊 我们来练习吧！试着说："{phrase}"——我会听并帮你说对！准备好了就点麦克风 🎙️',
    openingUnitChat: '你好！我是{name} 😊 恭喜你完成了第{unit}单元！让我们用你学到的内容自由对话吧。放轻松，没有压力！',
    openingFinalChallenge: '你好！我是{name} 😊 欢迎来到终极挑战！我们将涵盖所有单元的内容。没有提示——直接开始吧！准备好了吗？🏆',
    couldntHear: '我听不清楚。试着靠近麦克风说话 🎤',
    rightWordParticle: '词说对了！别忘了在结尾加上{particle}——试试：{expected}',

    // Onboarding
    yourLanguage: '你的语言？',
    pickNativeLang: '选择你的母语——我们将用它来教你。',
    whatToLearn: '你想学什么语言？',
    pickTargetLang: '选择一门语言——课程立即开始。',
    whatsYourLevel: '你的{lang}水平如何？',
    beHonest: '诚实回答——正确的起点让一切更轻松。',
    yourGender: '你的性别？',
    genderExplain: '{lang}根据说话者的性别使用不同的词。这会影响你的课程。',
    letsGo: '出发！',
    loadingCourse: '正在加载你的{lang}课程...',
    loadingCourses: '正在加载课程...',
    stepOf: '第{current}步，共{total}步',
    completeBeginner: '完全初学者',
    knowZeroWords: '我一个字都不会',
    knowBasics: '知道一些基础',
    canSayHello: '会说你好和数字',
    male: '男',
    female: '女',
    showBoth: '都显示',
    noCourses: '未找到课程。请确保课程文件存在于 languages/*/courses/',

    // Exercise instructions
    whatDoYouHear: '你听到了什么？',
    tapMatchingPairs: '点击匹配的词对',
    tapWordsBuild: '点击单词来组成句子',
    check: '检查',
    correctOrder: '正确顺序：',
    hearCorrectSentence: '听正确的句子',
  },

  // ─── Spanish (Latin American) ───
  es: {
    // VoiceChat
    sayThis: 'Di esto:',
    tapToSpeak: 'Toca para hablar',
    tapToStop: 'Toca para detener',
    analysing: 'Analizando...',
    analysingYourSpeech: 'Analizando tu pronunciación...',
    isSpeaking: '{name} está hablando...',
    isThinking: '{name} está pensando...',
    isListening: 'Escuchando...',
    replay: 'Repetir',
    lessonComplete: '¡Lección completa!',
    isProudOfYou: '¡{name} está orgulloso de ti!',
    whatYouPracticed: 'Lo que practicaste:',
    tryAgain: '¡Inténtalo de nuevo!',
    greatNowTry: '¡Muy bien! Ahora intenta: "{phrase}"',
    connectionIssue: 'Problema de conexión — toca el micrófono e intenta de nuevo',
    micError: 'No se pudo acceder al micrófono. Revisa los permisos del navegador',
    somethingWrong: 'Algo salió mal — intenta de nuevo',
    practice: 'Práctica: {title}',

    // LessonTeach
    lessonVocabulary: 'Vocabulario de la lección',
    noVocabulary: 'Aún no hay vocabulario para esta lección.',
    startQuiz: 'Comenzar quiz',
    next: 'Siguiente',
    back: 'Atrás',
    skipToQuiz: 'Ir al quiz',
    tapToListen: 'Toca para escuchar',
    heardIt: 'Ya lo escuché',
    tone: 'Tono {tone}',

    // ExerciseCard
    tapToHear: 'Toca para escuchar',
    whatDoesThisMean: '¿Qué significa esto?',
    answer: 'Respuesta:',
    listenAgain: 'Escuchar de nuevo',
    correct: '¡Correcto!',
    notQuite: 'No del todo',
    completeLesson: 'Completar lección',
    continue: 'Continuar',

    // LessonTree
    noCurriculum: 'Aún no hay plan de estudio',
    completeOnboarding: 'Completa la configuración para generar tu plan de estudio personalizado.',
    startOnboarding: 'Comenzar configuración',
    unitLabel: 'Unidad {num}: {title}',
    lessonsProgress: '{completed}/{total} lecciones',
    start: 'Comenzar',

    // Level selector
    levelA1: 'Principiante',
    levelA2: 'Elemental',
    levelB1: 'Intermedio',
    levelB2: 'Intermedio alto',
    skipToLevel: '¿Saltar a {level}?',
    skipToLevelDesc: 'Esto marcará los niveles anteriores como completados y empezarás en {level}.',
    skipConfirm: 'Sí, ya sé lo básico',

    // Course page
    yourAiTutor: 'Tu tutor de IA',
    completeUnitToUnlock: 'Completa una unidad para desbloquear el chat libre',
    course: 'Curso',
    conversationPractice: 'Práctica de conversación',
    unitChat: 'Chat Unidad {num} — Practica con {name}',
    completeUnitToUnlockN: 'Completa la Unidad {num} para desbloquear',
    willQuizYou: '{name} te evaluará del vocabulario de la Unidad {num}',
    finalChallenge: 'Desafío final — ¡{name} cubre todo!',
    completeAllUnits: 'Completa las {num} unidades para desbloquear el Desafío final',
    comprehensiveTest: 'Prueba completa — sin pistas ni frases',
    curriculumComplete: '¡Plan de estudio completado!',
    masteredLevel: '¡Dominaste el plan de estudio {level}. ¡Felicidades!',
    levelComplete: '¡{level} completado!',
    finishedAllUnits: 'Terminaste todas las unidades de {level}. El curso de {next} estará disponible pronto.',

    // Home page
    learnAnyLanguage: 'Aprende cualquier idioma.',
    builtForYou: 'Hecho a tu medida.',
    heroDesc: 'Cursos seleccionados con práctica de conversación con IA. Se ejecuta localmente con Ollama. Gratis para siempre.',
    level: 'Nivel {level}',
    lessonsCompleted: '{count} lección completada',
    lessonsCompletedPlural: '{count} lecciones completadas',
    continueLearning: 'Seguir aprendiendo {lang}',
    changeLanguage: 'Cambiar idioma / Reiniciar',
    resetConfirm: 'Esto borrará tu perfil y tu plan de estudio. ¿Estás seguro?',
    cancel: 'Cancelar',
    reset: 'Reiniciar',
    featureCurated: 'Cursos seleccionados — empieza a aprender en 5 segundos',
    featureChat: 'Práctica real de conversación con IA después de cada unidad',
    featureLocal: 'Se ejecuta 100% en tu dispositivo — tus datos nunca salen de tu máquina',
    featureFree: 'Sin cuenta · Sin suscripción · Gratis para siempre',
    startLearning: 'Empezar a aprender',
    freeOpenSource: 'Gratis · Código abierto · Sin cuenta',

    // Lesson page
    loadingLesson: 'Cargando lección...',
    lessonNotFound: 'Lección no encontrada',
    speakWith: 'Hablar con {name}',

    // VoiceChat opening messages
    openingPractice: '¡Hola! Soy {name} 😊 ¡Vamos a practicar! Intenta decir: "{phrase}" — te escucho y te ayudo a decirlo bien. ¡Toca el micrófono cuando estés listo! 🎙️',
    openingUnitChat: '¡Hola! Soy {name} 😊 ¡Felicidades por terminar la Unidad {unit}! Vamos a conversar usando lo que aprendiste. Habla con naturalidad, ¡sin presión!',
    openingFinalChallenge: '¡Hola! Soy {name} 😊 ¡Bienvenido al Desafío final! Vamos a repasar todo lo de las unidades. Sin pistas — ¡solo habla! ¿Listo? 🏆',
    couldntHear: 'No te escuché bien. Intenta hablar más cerca del micrófono 🎤',
    rightWordParticle: '¡Buena palabra! No olvides {particle} al final — intenta: {expected}',

    // Onboarding
    yourLanguage: '¿Tu idioma?',
    pickNativeLang: 'Elige el idioma que hablas — te enseñaremos en ese idioma.',
    whatToLearn: '¿Qué idioma quieres aprender?',
    pickTargetLang: 'Elige un idioma — tu curso empieza de inmediato.',
    whatsYourLevel: '¿Cuál es tu nivel de {lang}?',
    beHonest: 'Sé honesto — el punto de partida correcto lo hace todo más fácil.',
    yourGender: '¿Tu género?',
    genderExplain: '{lang} usa diferentes palabras según el género del hablante. Esto afecta tus lecciones.',
    letsGo: '¡Vamos!',
    loadingCourse: 'Cargando tu curso de {lang}...',
    loadingCourses: 'Cargando cursos...',
    stepOf: 'Paso {current} de {total}',
    completeBeginner: 'Principiante total',
    knowZeroWords: 'No sé ni una palabra',
    knowBasics: 'Sé algo básico',
    canSayHello: 'Puedo saludar y decir números',
    male: 'Masculino',
    female: 'Femenino',
    showBoth: 'Mostrar ambos',
    noCourses: 'No se encontraron cursos. Asegúrate de que los archivos existan en languages/*/courses/',

    // Exercise instructions
    whatDoYouHear: '¿Qué escuchas?',
    tapMatchingPairs: 'Empareja los pares',
    tapWordsBuild: 'Toca las palabras para formar la oración',
    check: 'Verificar',
    correctOrder: 'Orden correcto:',
    hearCorrectSentence: 'Escuchar la oración correcta',
  },

  // ─── Thai (casual natural) ───
  th: {
    // VoiceChat
    sayThis: 'พูดว่า:',
    tapToSpeak: 'แตะเพื่อพูด',
    tapToStop: 'แตะเพื่อหยุด',
    analysing: 'กำลังวิเคราะห์...',
    analysingYourSpeech: 'กำลังวิเคราะห์เสียงของคุณ...',
    isSpeaking: '{name} กำลังพูด...',
    isThinking: '{name} กำลังคิด...',
    isListening: 'กำลังฟัง...',
    replay: 'เล่นซ้ำ',
    lessonComplete: 'เรียนจบแล้ว!',
    isProudOfYou: '{name} ภูมิใจในตัวคุณ!',
    whatYouPracticed: 'ที่คุณฝึกไป:',
    tryAgain: 'ลองอีกครั้ง!',
    greatNowTry: 'เยี่ยม! ลองพูดว่า: "{phrase}"',
    connectionIssue: 'การเชื่อมต่อมีปัญหา — แตะไมค์แล้วลองใหม่',
    micError: 'เข้าถึงไมโครโฟนไม่ได้ ตรวจสอบสิทธิ์ของเบราว์เซอร์',
    somethingWrong: 'มีบางอย่างผิดพลาด — ลองอีกครั้ง',
    practice: 'ฝึก: {title}',

    // LessonTeach
    lessonVocabulary: 'คำศัพท์ในบทเรียน',
    noVocabulary: 'ยังไม่มีคำศัพท์สำหรับบทเรียนนี้',
    startQuiz: 'เริ่มทำแบบทดสอบ',
    next: 'ถัดไป',
    back: 'กลับ',
    skipToQuiz: 'ข้ามไปทำแบบทดสอบ',
    tapToListen: 'แตะเพื่อฟัง',
    heardIt: 'ฟังแล้ว',
    tone: 'เสียง {tone}',

    // ExerciseCard
    tapToHear: 'แตะเพื่อฟัง',
    whatDoesThisMean: 'นี่แปลว่าอะไร?',
    answer: 'คำตอบ:',
    listenAgain: 'ฟังอีกครั้ง',
    correct: 'ถูกต้อง!',
    notQuite: 'ยังไม่ถูกนะ',
    completeLesson: 'จบบทเรียน',
    continue: 'ต่อไป',

    // LessonTree
    noCurriculum: 'ยังไม่มีหลักสูตร',
    completeOnboarding: 'ตั้งค่าให้เสร็จเพื่อสร้างหลักสูตรเฉพาะคุณ',
    startOnboarding: 'เริ่มตั้งค่า',
    unitLabel: 'บทที่ {num}: {title}',
    lessonsProgress: '{completed}/{total} บทเรียน',
    start: 'เริ่มเลย',

    // Level selector
    levelA1: 'เริ่มต้น',
    levelA2: 'พื้นฐาน',
    levelB1: 'กลาง',
    levelB2: 'กลางขั้นสูง',
    skipToLevel: 'ข้ามไป {level} เลย?',
    skipToLevelDesc: 'ระบบจะเครื่องหมายระดับก่อนหน้าว่าเรียนจบแล้ว แล้วเริ่มที่ {level}',
    skipConfirm: 'ใช่ ฉันรู้พื้นฐานแล้ว',

    // Course page
    yourAiTutor: 'ติวเตอร์ AI ของคุณ',
    completeUnitToUnlock: 'เรียนจบบทเพื่อปลดล็อกแชทอิสระ',
    course: 'คอร์ส',
    conversationPractice: 'ฝึกสนทนา',
    unitChat: 'แชทบทที่ {num} — ฝึกกับ {name}',
    completeUnitToUnlockN: 'เรียนจบบทที่ {num} เพื่อปลดล็อก',
    willQuizYou: '{name} จะทดสอบคำศัพท์บทที่ {num} ของคุณ',
    finalChallenge: 'ด่านสุดท้าย — {name} ทดสอบทุกอย่าง!',
    completeAllUnits: 'เรียนจบทั้ง {num} บทเพื่อปลดล็อกด่านสุดท้าย',
    comprehensiveTest: 'ทดสอบรวม — ไม่มีคำใบ้ ไม่มีประโยคช่วย',
    curriculumComplete: 'เรียนจบหลักสูตรแล้ว!',
    masteredLevel: 'คุณเรียนจบหลักสูตร {level} แล้ว ยินดีด้วย!',
    levelComplete: '{level} เสร็จสมบูรณ์!',
    finishedAllUnits: 'คุณเรียนจบทุกบทของ {level} แล้ว คอร์ส {next} กำลังจะมาเร็วๆ นี้',

    // Home page
    learnAnyLanguage: 'เรียนภาษาอะไรก็ได้',
    builtForYou: 'สร้างมาเพื่อคุณ',
    heroDesc: 'คอร์สคัดสรรพร้อมฝึกสนทนากับ AI รันบนเครื่องด้วย Ollama ฟรีตลอดไป',
    level: 'ระดับ {level}',
    lessonsCompleted: 'เรียนจบ {count} บท',
    lessonsCompletedPlural: 'เรียนจบ {count} บท',
    continueLearning: 'เรียน {lang} ต่อ',
    changeLanguage: 'เปลี่ยนภาษา / รีเซ็ต',
    resetConfirm: 'ข้อมูลโปรไฟล์และหลักสูตรจะถูกลบ คุณแน่ใจหรือเปล่า?',
    cancel: 'ยกเลิก',
    reset: 'รีเซ็ต',
    featureCurated: 'คอร์สคัดสรร — เริ่มเรียนใน 5 วินาที',
    featureChat: 'ฝึกสนทนากับ AI จริงๆ หลังจบทุกบท',
    featureLocal: 'รันบนเครื่อง 100% — ข้อมูลไม่ออกจากเครื่องคุณ',
    featureFree: 'ไม่ต้องสมัคร · ไม่ต้องจ่าย · ฟรีตลอดไป',
    startLearning: 'เริ่มเรียน',
    freeOpenSource: 'ฟรี · โอเพนซอร์ส · ไม่ต้องสมัคร',

    // Lesson page
    loadingLesson: 'กำลังโหลดบทเรียน...',
    lessonNotFound: 'ไม่พบบทเรียน',
    speakWith: 'พูดกับ {name}',

    // VoiceChat opening messages
    openingPractice: 'สวัสดี! ฉันชื่อ {name} 😊 มาฝึกกันเลย! ลองพูดว่า: "{phrase}" — ฉันจะฟังแล้วช่วยคุณนะ แตะไมค์เมื่อพร้อม 🎙️',
    openingUnitChat: 'สวัสดี! ฉันชื่อ {name} 😊 ยินดีด้วยที่เรียนจบบทที่ {unit}! มาคุยกันโดยใช้สิ่งที่เรียนมาเลย พูดตามสบาย ไม่ต้องกดดัน!',
    openingFinalChallenge: 'สวัสดี! ฉันชื่อ {name} 😊 ยินดีต้อนรับสู่ด่านสุดท้าย! เราจะทบทวนทุกอย่างจากทุกบท ไม่มีคำใบ้ — แค่พูดเลย! พร้อมหรือยัง? 🏆',
    couldntHear: 'ฟังไม่ชัดเลย ลองพูดใกล้ไมค์อีกนิดนะ 🎤',
    rightWordParticle: 'คำถูกแล้ว! อย่าลืม {particle} ตรงท้ายนะ — ลอง: {expected}',

    // Onboarding
    yourLanguage: 'ภาษาของคุณ?',
    pickNativeLang: 'เลือกภาษาที่คุณพูด — เราจะสอนคุณในภาษานั้น',
    whatToLearn: 'อยากเรียนภาษาอะไร?',
    pickTargetLang: 'เลือกภาษา — คอร์สเริ่มทันที',
    whatsYourLevel: 'ระดับ {lang} ของคุณเป็นยังไง?',
    beHonest: 'ตอบตามจริงนะ — จุดเริ่มต้นที่ถูกต้องจะทำให้ทุกอย่างง่ายขึ้น',
    yourGender: 'เพศของคุณ?',
    genderExplain: '{lang} ใช้คำแตกต่างกันตามเพศของผู้พูด สิ่งนี้จะส่งผลต่อบทเรียนของคุณ',
    letsGo: 'ไปเลย!',
    loadingCourse: 'กำลังโหลดคอร์ส {lang} ของคุณ...',
    loadingCourses: 'กำลังโหลดคอร์ส...',
    stepOf: 'ขั้นที่ {current} จาก {total}',
    completeBeginner: 'เริ่มจากศูนย์',
    knowZeroWords: 'ไม่รู้สักคำ',
    knowBasics: 'รู้พื้นฐานนิดหน่อย',
    canSayHello: 'พูดสวัสดีกับนับเลขได้',
    male: 'ชาย',
    female: 'หญิง',
    showBoth: 'แสดงทั้งสองแบบ',
    noCourses: 'ไม่พบคอร์ส ตรวจสอบว่าไฟล์คอร์สอยู่ใน languages/*/courses/',

    // Exercise instructions
    whatDoYouHear: 'คุณได้ยินอะไร?',
    tapMatchingPairs: 'แตะคู่ที่ตรงกัน',
    tapWordsBuild: 'แตะคำเพื่อสร้างประโยค',
    check: 'ตรวจ',
    correctOrder: 'ลำดับที่ถูกต้อง:',
    hearCorrectSentence: 'ฟังประโยคที่ถูกต้อง',
  },

  // ─── Korean (polite 존댓말) ───
  ko: {
    // VoiceChat
    sayThis: '이렇게 말해 보세요:',
    tapToSpeak: '탭하여 말하기',
    tapToStop: '탭하여 멈추기',
    analysing: '분석 중...',
    analysingYourSpeech: '발음을 분석하고 있어요...',
    isSpeaking: '{name}이(가) 말하고 있어요...',
    isThinking: '{name}이(가) 생각하고 있어요...',
    isListening: '듣고 있어요...',
    replay: '다시 듣기',
    lessonComplete: '수업 완료!',
    isProudOfYou: '{name}이(가) 자랑스러워해요!',
    whatYouPracticed: '연습한 내용:',
    tryAgain: '다시 해 보세요!',
    greatNowTry: '잘했어요! 이제 이걸 말해 보세요: "{phrase}"',
    connectionIssue: '연결에 문제가 있어요 — 마이크를 탭하고 다시 시도해 주세요',
    micError: '마이크에 접근할 수 없어요. 브라우저 권한을 확인해 주세요',
    somethingWrong: '문제가 발생했어요 — 다시 시도해 주세요',
    practice: '연습: {title}',

    // LessonTeach
    lessonVocabulary: '수업 어휘',
    noVocabulary: '아직 이 수업의 어휘가 없어요.',
    startQuiz: '퀴즈 시작',
    next: '다음',
    back: '뒤로',
    skipToQuiz: '퀴즈로 건너뛰기',
    tapToListen: '탭하여 듣기',
    heardIt: '들었어요',
    tone: '{tone}성',

    // ExerciseCard
    tapToHear: '탭하여 듣기',
    whatDoesThisMean: '이것은 무슨 뜻인가요?',
    answer: '정답:',
    listenAgain: '다시 듣기',
    correct: '정답이에요!',
    notQuite: '아쉬워요',
    completeLesson: '수업 완료하기',
    continue: '계속하기',

    // LessonTree
    noCurriculum: '아직 커리큘럼이 없어요',
    completeOnboarding: '맞춤 커리큘럼을 만들려면 설정을 완료해 주세요.',
    startOnboarding: '설정 시작',
    unitLabel: '단원 {num}: {title}',
    lessonsProgress: '{completed}/{total} 수업',
    start: '시작',

    // Level selector
    levelA1: '입문',
    levelA2: '초급',
    levelB1: '중급',
    levelB2: '중상급',
    skipToLevel: '{level}로 건너뛸까요?',
    skipToLevelDesc: '이전 단계를 완료한 것으로 처리하고 {level}에서 시작해요.',
    skipConfirm: '네, 기초는 알고 있어요',

    // Course page
    yourAiTutor: 'AI 튜터',
    completeUnitToUnlock: '단원을 완료하면 자유 대화가 열려요',
    course: '코스',
    conversationPractice: '회화 연습',
    unitChat: '단원 {num} 대화 — {name}와(과) 연습하기',
    completeUnitToUnlockN: '단원 {num}을(를) 완료하면 열려요',
    willQuizYou: '{name}이(가) 단원 {num} 어휘를 테스트해요',
    finalChallenge: '파이널 챌린지 — {name}이(가) 전부 다뤄요!',
    completeAllUnits: '파이널 챌린지를 열려면 {num}개 단원을 모두 완료하세요',
    comprehensiveTest: '종합 테스트 — 힌트 없이, 문구 없이',
    curriculumComplete: '커리큘럼을 모두 마쳤어요!',
    masteredLevel: '{level} 커리큘럼을 마스터했어요. 축하해요!',
    levelComplete: '{level} 완료!',
    finishedAllUnits: '{level}의 모든 단원을 끝냈어요. {next} 코스가 곧 나와요.',

    // Home page
    learnAnyLanguage: '어떤 언어든 배워 보세요.',
    builtForYou: '나만을 위해 만들었어요.',
    heroDesc: 'AI 회화 연습이 포함된 맞춤 코스. Ollama로 로컬 실행. 영원히 무료.',
    level: '레벨 {level}',
    lessonsCompleted: '{count}개 수업 완료',
    lessonsCompletedPlural: '{count}개 수업 완료',
    continueLearning: '{lang} 계속 배우기',
    changeLanguage: '언어 변경 / 초기화',
    resetConfirm: '프로필과 커리큘럼이 삭제돼요. 정말 할까요?',
    cancel: '취소',
    reset: '초기화',
    featureCurated: '맞춤 코스 — 5초 만에 시작',
    featureChat: '매 단원 후 진짜 AI 회화 연습',
    featureLocal: '100% 로컬 실행 — 데이터가 기기 밖으로 나가지 않아요',
    featureFree: '계정 불필요 · 구독 불필요 · 영원히 무료',
    startLearning: '학습 시작',
    freeOpenSource: '무료 · 오픈소스 · 계정 불필요',

    // Lesson page
    loadingLesson: '수업을 불러오는 중...',
    lessonNotFound: '수업을 찾을 수 없어요',
    speakWith: '{name}와(과) 대화하기',

    // VoiceChat opening messages
    openingPractice: '안녕하세요! 저는 {name}이에요 😊 같이 연습해 봐요! "{phrase}"라고 말해 보세요 — 제가 듣고 도와줄게요! 준비되면 마이크를 탭하세요 🎙️',
    openingUnitChat: '안녕하세요! 저는 {name}이에요 😊 단원 {unit}을 끝내셨군요, 축하해요! 배운 내용으로 자유롭게 대화해 봐요. 편하게 말해 주세요!',
    openingFinalChallenge: '안녕하세요! 저는 {name}이에요 😊 파이널 챌린지에 오신 걸 환영해요! 모든 단원의 내용을 다룰 거예요. 힌트 없이 — 그냥 말해 보세요! 준비됐나요? 🏆',
    couldntHear: '잘 안 들렸어요. 마이크에 더 가까이 대고 말해 보세요 🎤',
    rightWordParticle: '단어는 맞아요! 끝에 {particle}을(를) 잊지 마세요 — 이렇게요: {expected}',

    // Onboarding
    yourLanguage: '사용하시는 언어는?',
    pickNativeLang: '모국어를 선택하세요 — 그 언어로 가르쳐 드려요.',
    whatToLearn: '어떤 언어를 배우고 싶으세요?',
    pickTargetLang: '언어를 선택하세요 — 바로 코스가 시작돼요.',
    whatsYourLevel: '{lang} 수준이 어느 정도인가요?',
    beHonest: '솔직하게 답해 주세요 — 맞는 출발점이 모든 걸 쉽게 만들어요.',
    yourGender: '성별은요?',
    genderExplain: '{lang}은(는) 화자의 성별에 따라 다른 표현을 써요. 이것이 수업에 반영돼요.',
    letsGo: '시작해요!',
    loadingCourse: '{lang} 코스를 불러오는 중...',
    loadingCourses: '코스를 불러오는 중...',
    stepOf: '{total}단계 중 {current}단계',
    completeBeginner: '완전 초보',
    knowZeroWords: '아는 단어가 하나도 없어요',
    knowBasics: '기초 몇 가지는 알아요',
    canSayHello: '인사와 숫자는 할 수 있어요',
    male: '남성',
    female: '여성',
    showBoth: '둘 다 보여 주세요',
    noCourses: '코스를 찾을 수 없어요. languages/*/courses/에 코스 파일이 있는지 확인해 주세요.',

    // Exercise instructions
    whatDoYouHear: '무엇이 들리나요?',
    tapMatchingPairs: '일치하는 쌍을 탭하세요',
    tapWordsBuild: '단어를 탭하여 문장을 만드세요',
    check: '확인',
    correctOrder: '올바른 순서:',
    hearCorrectSentence: '올바른 문장 듣기',
  },
}

/**
 * Translate a key to the user's native language.
 *
 * Supports interpolation: t('hello', 'en', { name: 'Nong' })
 * Template: "Hello {name}!" → "Hello Nong!"
 */
export function t(
  key: string,
  nativeLang: string = 'en',
  vars?: Record<string, string | number>,
): string {
  const dict = translations[nativeLang] || translations.en
  let text = dict[key] || translations.en[key] || key

  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }

  return text
}

/**
 * Get all available UI languages (for native language picker).
 */
export function getAvailableUILanguages(): Array<{ code: string; label: string }> {
  return Object.keys(translations).map(code => ({
    code,
    label: translations[code]?.startLearning ? code : code,
  }))
}
