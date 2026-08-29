// Normalize every asset into { name, src, rawName } so app.js can handle local and remote logos.
const KNOWN_NAMES = {
  FR: {
    "af.svg": "Action Française",
    "upr.png": "Union Populaire Républicaine (UPR)",
    "r!.png": "Reconquête!",
    "dlf.svg": "Debout la France",
    "il.png": "Identité-Libertés",
    "rn.png": "Rassemblement National (RN)",
    "udr.svg": "Union des Droites pour la République (UDR)",
    "rpf.svg": "Rassemblement pour la France (RPF)",
    "ump.png": "UMP",
    "lr.png": "Les Républicains (LR)",
    "horizons.png": "Horizons",
    "pr.png": "Parti Radical",
    "re.png": "Renaissance",
    "modem.png": "MoDem",
    "pp.png": "Place Publique",
    "ps.png": "Parti Socialiste (PS)",
    "sfio.svg": "SFIO",
    "gens.png": "Les Gens / GRS",
    "apres.png": "L'Après",
    "lfi.png": "La France Insoumise (LFI)",
    "pcf.png": "Parti Communiste Français (PCF)",
    "eelv.png": "Les Écologistes (EELV)",
    "nfp.png": "Nouveau Front Populaire (NFP)",
    "nupes.png": "NUPES",
    "cgt.png": "CGT"
  },
  UK: {
    "ukip.png": "UKIP",
    "adv.jpg": "Advance UK",
    "rest.png": "Restoration Party",
    "ref.png": "Reform UK",
    "cons.png": "Conservative Party (Tories)",
    "lab.png": "Labour Party",
    "liberal.png": "Liberal Party",
    "libdem.png": "Liberal Democrats",
    "green.png": "Green Party",
    "yourparty.svg": "Your Party",
    "snp.png": "Scottish National Party (SNP)",
    "sf.png": "Sinn Féin",
    "dup.png": "Democratic Unionist Party (DUP)",
    "cd.png": "Christian Peoples Alliance"
  },
  TN: {
    "true25july.png": "Masar 25 Juillet (مسار 25 جويلية)",
    "ptr.png": "Parti Tunisie Révolution (تونس الثورة)",
    "psd.png": "PSD (Parti Socialiste Destourien)",
    "pup.png": "PUP (Parti de l'Unité Populaire)",
    "el-amen.png": "Parti Al-Aman (حزب الأمان)",
    "fsn.png": "Front de Salut National (جبهة الخلاص)",
    "mup.png": "MUP (Mouvement d'Unité Populaire)",
    "haq.png": "Al-Haq (حزب الحق)",
    "ptv.png": "Parti Tunisie Verte (تونس الخضراء)",
    "hizbelhiraq.png": "Al-Irada / Harak Tounes (حراك تونس الإرادة)",
    "mjt.png": "MJT (Mouvement Jeunesse Tunisienne)",
    "mds.png": "MDS (Mouvement des Démocrates Socialistes)",
    "ppt.png": "Parti Populaire Tunisien (الشعبي التونسي)",
    "mta.png": "Tunisie en Avant (تونس إلى الأمام)",
    "upr.png": "UPR Tunisie (الاتحاد الشعبي الجمهوري)",
    "nidaatounes.png": "Nidaa Tounes (نداء تونس)",
    "wafa.png": "Mouvement Wafa (حركة وفاء)",
    "paritsocialliberal.png": "Parti Social Libéral (الحزب الاجتماعي التحرري)",
    "ppds.png": "PPDS",
    "aljoumhouri.png": "Al-Joumhouri (الحزب الجمهوري)",
    "mrt.png": "MRT (Révolution Tunisienne)",
    "al-massar.png": "Al-Massar (المسار الديمقراطي الاجتماعي)",
    "pvp.png": "Voix du Peuple (صوت الشعب)",
    "baath.png": "Parti Baath (حزب البعث)",
    "thirdrepublic.png": "Troisième République (الجمهورية الثالثة)",
    "echaab.png": "Mouvement Echaab (حركة الشعب)",
    "tnp.png": "Parti National Tunisien (القومي التونسي)",
    "ennahdha.png": "Ennahdha (حركة النهضة)",
    "upl.png": "UPL (Union Patriotique Libre)",
    "errahmah.png": "Parti Errahmah (حزب الرحمة)",
    "watad.png": "Watad (الوطنيين الديمقراطيين الموحد)",
    "ettakatol.png": "Ettakatol (التكتل)",
    "qalbtounes.png": "Qalb Tounes (قلب تونس)",
    "frontpopulaire.png": "Front Populaire (الجبهة الشعبية)",
    "tahyatounes.png": "Tahya Tounes (تحيا تونس)",
    "25july.png": "Mouvement 25 Juillet (حركة 25 جويلية)",
    "albadil.png": "Al-Badil Ettounsi (البديل التونسي)",
    "alkarama.png": "Coalition Al-Karama (ائتلاف الكرامة)",
    "azimoun.png": "Azimoun (عازمون)",
    "attayar.png": "Courant Démocrate / Attayar (التيار الديمقراطي)",
    "cn.png": "CPR (المؤتمر من أجل الجمهورية)",
    "alamal.png": "Parti Al-Amal (حزب الأمل)",
    "pdl.png": "PDL (الحزب الدستوري الحر)",
    "al-qotb.png": "Al-Qotb (القطب)",
    "plt.png": "Parti Libéral Tunisien",
    "afektounes.png": "Afek Tounes (آفاق تونس)",
    "popularcurrent.png": "Courant Populaire (التيار الشعبي)",
    "ps.png": "Parti Socialiste (الاشتراكي)",
    "pt.png": "Parti des Travailleurs (حزب العمال)",
    "ptpd.png": "PTPD (العمل الوطني الديمقراطي)"
  }
};

for (const [code, country] of Object.entries(ASSETS_DATA)) {
  country.files = country.files.map((file) => {
    if (typeof file === "string") {
      const prettyName = KNOWN_NAMES[code]?.[file] || file.replace(/\.[^/.]+$/, "").toUpperCase();
      return {
        name: prettyName,
        rawFile: file,
        src: `assets/${code}/${file}`
      };
    }
    return file;
  });
}

