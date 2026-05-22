import Header from '@/components/Header';
import Link from 'next/link';
import {
  Sparkles, Wand2, Zap, Shield, Film, Music,
  Scissors, Layers, Download,
} from 'lucide-react';

const features = [
  {
    icon: Wand2,
    title: 'مونتاج تلقائي',
    desc: 'ارفع الفيديوهات وخلّيه يشتغل. الذكاء يختار أفضل اللقطات ويظبط التوقيت',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Zap,
    title: 'ترانزيشن ذكية',
    desc: 'تلاتين نوع ترانزيشن يتظبطوا تلقائي على إيقاع الموسيقى',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Music,
    title: 'تزامن مع الموسيقى',
    desc: 'المونتاج بيتظبط على البيتات والـ BPM بتاع الموسيقى اللي تختارها',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: Layers,
    title: '8 قوالب جاهزة',
    desc: 'سينمائي، عصري، فلوق، برومو، سفر، ريترو، قيمنج، زفاف - كل اللي تحتاجه',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Scissors,
    title: 'تحليل ذكي',
    desc: 'يكشف المشاهد ويحلل الحركة ويختار أحسن اللقطات تلقائياً',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'خصوصية تامة',
    desc: 'كل حاجة بتشتغل على جهازك. الفيديوهات مش بتتسرب أو تترفع لخوادم تانية',
    color: 'from-indigo-500 to-violet-500',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      <Header />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-32 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>بالذكاء الاصطناعي</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-black leading-tight mb-6">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                صانع الفيديو
              </span>
              <br />
              <span>الذكي</span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              ارفع الفيديوهات الخام بتاعتك، اختار قالب مونتاج، وخلي الذكاء الاصطناعي
              يعمل كل الشغل. ترانزيشن، مؤثرات، توقيت - كله تلقائي.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-lg transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                <Wand2 className="w-5 h-5" />
                ابدأ المونتاج مجاناً
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              {[
                { label: 'قوالب', value: '8' },
                { label: 'ترانزيشن', value: '+7' },
                { label: 'معالجة', value: 'محلية' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-zinc-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              كل اللي تحتاجه في مكان واحد
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              أدوات احترافية بمجهود صفر. المونتاج اللي كان ياخد ساعات، بقى خلاص في ثواني
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 pb-32">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-purple-600/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                جاهز تجرب؟
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
                ارفع فيديوهاتك دلوقتي وشوف المونتاج بيتعمل قدام عينيك
              </p>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors"
              >
                <Film className="w-5 h-5" />
                جرب المونتاج دلوقتي
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-600">
          VideoForge - صانع الفيديو الذكي. كل الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
