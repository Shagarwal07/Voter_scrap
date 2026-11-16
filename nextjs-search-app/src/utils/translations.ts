export type Language = 'en' | 'hi';

export const translations = {
  // Navigation & Branding
  app_title: {
    en: 'Electoral Roll Explorer',
    hi: 'मतदाता सूची अन्वेषक'
  },
  app_subtitle: {
    en: 'Unofficial Voter Lookup Portal Balotra',
    hi: 'अनौपचारिक मतदाता खोज पोर्टल बालोतरा'
  },
  unofficial_portal: {
    en: 'UNOFFICIAL PORTAL',
    hi: 'अनौपचारिक पोर्टल'
  },
  unverified_data: {
    en: 'UNVERIFIED DATA',
    hi: 'अपुष्ट डेटा'
  },
  btn_main_search: {
    en: 'Main Search',
    hi: 'मुख्य खोज'
  },
  btn_house_search: {
    en: 'House Search',
    hi: 'मकान-वार खोज'
  },
  btn_live_db: {
    en: 'Live DB Details',
    hi: 'लाइव डेटाबेस विवरण'
  },
  btn_slips_reports: {
    en: 'Slips Reports',
    hi: 'पर्ची रिपोर्ट्स'
  },
  total_database_voters: {
    en: 'Registered Voters',
    hi: 'पंजीकृत मतदाता'
  },

  // Election Selection
  election_mode: {
    en: 'Election Mode',
    hi: 'चुनाव चयन'
  },
  nagar_parishad: {
    en: 'Municipal Council',
    hi: 'नगर परिषद'
  },
  ward_5: {
    en: 'Ward 5',
    hi: 'वार्ड 5'
  },
  vidhan_sabha: {
    en: 'Legislative Assembly',
    hi: 'विधान सभा'
  },
  pachpadra_137: {
    en: '137-Pachpadra',
    hi: '137-पचपदरा'
  },
  title_np: {
    en: 'Balotra Municipal Council (Ward Election Data)',
    hi: 'नगर परिषद बालोतरा (वार्ड चुनाव डेटा)'
  },
  title_vs: {
    en: 'Vidhan Sabha Election (137-Pachpadra)',
    hi: 'विधान सभा चुनाव (137-पचपदरा)'
  },

  // Search Tabs & Form
  tab_voter_id: {
    en: 'Voter ID (EPIC)',
    hi: 'मतदाता पहचान पत्र (EPIC)'
  },
  tab_name: {
    en: 'Name',
    hi: 'नाम द्वारा'
  },
  tab_house: {
    en: 'House No.',
    hi: 'मकान संख्या'
  },
  tab_serial: {
    en: 'Serial No.',
    hi: 'क्रमांक'
  },
  placeholder_voter_id: {
    en: 'Enter Voter ID (e.g. SSB1234567)',
    hi: 'मतदाता पहचान पत्र संख्या दर्ज करें (जैसे SSB1234567)'
  },
  placeholder_name: {
    en: 'Type Name in English to transliterate to Hindi (e.g. Ramesh)',
    hi: 'नाम अंग्रेजी में टाइप करें (जैसे Ramesh -> रमेश)'
  },
  placeholder_house: {
    en: 'Enter House Number (e.g. 12 or 12/4)',
    hi: 'मकान संख्या दर्ज करें (जैसे 12 या 12/4)'
  },
  placeholder_serial: {
    en: 'Enter Serial Number (e.g. 450)',
    hi: 'मतदाता क्रमांक दर्ज करें (जैसे 450)'
  },
  filter_all_wards: {
    en: 'All Wards',
    hi: 'सभी वार्ड'
  },
  filter_all_parts: {
    en: 'All Parts',
    hi: 'सभी भाग'
  },
  filter_ward_label: {
    en: 'Ward',
    hi: 'वार्ड'
  },
  filter_part_label: {
    en: 'Part',
    hi: 'भाग'
  },
  btn_search: {
    en: 'SEARCH ARCHIVES',
    hi: 'मतदाता खोजें'
  },
  searching: {
    en: 'SEARCHING...',
    hi: 'खोज जारी है...'
  },
  results_title: {
    en: 'Search Results',
    hi: 'खोज परिणाम'
  },
  results_subtitle: {
    en: 'Live query output from the electoral database.',
    hi: 'मतदाता डेटाबेस से प्राप्त परिणाम।'
  },
  no_records_found: {
    en: 'NO RECORDS FOUND IN CURRENT FILE.',
    hi: 'वर्तमान सूची में कोई रिकॉर्ड नहीं मिला।'
  },

  // Table Headers
  th_ward: {
    en: 'Ward',
    hi: 'वार्ड'
  },
  th_part: {
    en: 'Part',
    hi: 'भाग'
  },
  th_page: {
    en: 'Page',
    hi: 'पृष्ठ'
  },
  th_source_file: {
    en: 'Source File',
    hi: 'स्रोत फ़ाइल'
  },
  th_serial_no: {
    en: 'Serial No.',
    hi: 'क्रमांक'
  },
  th_name: {
    en: 'Name',
    hi: 'मतदाता का नाम'
  },
  th_voter_id: {
    en: 'Voter ID',
    hi: 'पहचान पत्र (EPIC)'
  },
  th_relative_name: {
    en: "Relative's Name",
    hi: 'पिता / पति का नाम'
  },
  th_relation: {
    en: 'Relation',
    hi: 'सम्बन्ध'
  },
  th_age: {
    en: 'Age',
    hi: 'आयु'
  },
  th_gender: {
    en: 'Gender',
    hi: 'लिंग'
  },
  th_house_no: {
    en: 'House No.',
    hi: 'मकान सं.'
  },
  status_deleted: {
    en: 'Deleted',
    hi: 'विलोपित'
  },

  // House Finder
  house_search_title: {
    en: 'Household & Street Finder',
    hi: 'मकान व गली खोज'
  },
  house_search_subtitle: {
    en: 'Organized street-level batches for field workers and door-to-door volunteers.',
    hi: 'फील्ड कार्यकर्ताओं और घर-घर पर्ची वितरण हेतु गली-वार मतदाता समूह।'
  },
  house_search_desc_vs: {
    en: 'Find voter families by polling slip and house number for door-to-door campaigning.',
    hi: 'घर-घर संपर्क हेतु मतदान पर्ची व मकान नंबर अनुसार मतदाता परिवार खोजें।'
  },
  house_search_desc_np: {
    en: 'Find voter families by street (gali) and house number for door-to-door campaigning.',
    hi: 'घर-घर संपर्क हेतु गली व मकान नंबर अनुसार मतदाता परिवार खोजें।'
  },
  house_member_placeholder: {
    en: 'Search member by name (optional)...',
    hi: 'सदस्य का नाम खोजें (वैकल्पिक)...'
  },
  all_blocks: {
    en: 'All Blocks',
    hi: 'सभी ब्लॉक'
  },
  all_slips: {
    en: 'All Slips',
    hi: 'सभी पर्चियाँ'
  },
  all_galis: {
    en: 'All Galis / Streets',
    hi: 'सभी गलियाँ'
  },
  all_houses_in_slip: {
    en: 'All Houses in Slip',
    hi: 'पर्ची के सभी मकान'
  },
  select_slip_first: {
    en: 'Select Slip First',
    hi: 'पहले पर्ची चुनें'
  },
  select_block_first: {
    en: 'Select Block First',
    hi: 'पहले ब्लॉक चुनें'
  },
  btn_search_house_segments: {
    en: 'SEARCH HOUSE SEGMENTS',
    hi: 'मकान समूह खोजें'
  },
  btn_search_house: {
    en: 'SEARCH HOUSE',
    hi: 'मकान खोजें'
  },
  members_count: {
    en: 'Members',
    hi: 'सदस्य'
  },
  slip_label: {
    en: 'Slip',
    hi: 'पर्ची'
  },
  house_label: {
    en: 'House',
    hi: 'मकान'
  },

  // Database Stats Modal
  db_modal_title: {
    en: 'Live Database Details',
    hi: 'लाइव डेटाबेस विवरण'
  },
  db_valid_voters: {
    en: 'Total Valid Voters',
    hi: 'कुल वैध मतदाता'
  },
  db_missing_shifted: {
    en: 'Total Missing/Shifted',
    hi: 'कुल विलोपित / स्थानांतरित'
  },
  db_th_ward_part: {
    en: 'Part / Ward',
    hi: 'भाग / वार्ड सं.'
  },
  db_th_male: {
    en: 'Male',
    hi: 'पुरुष'
  },
  db_th_female: {
    en: 'Female',
    hi: 'महिला'
  },
  db_th_total: {
    en: 'Total',
    hi: 'कुल'
  },
  db_th_missing: {
    en: 'Missing No.',
    hi: 'शेष / विलोपित क्रमांक'
  },
  db_missing_badge: {
    en: 'Missing',
    hi: 'शेष'
  },
  db_missing_heading: {
    en: 'Missing / Shifted / Deleted Serial Numbers',
    hi: 'शेष / स्थानांतरित / विलोपित मतदाता क्रमांक'
  },
  db_no_missing: {
    en: 'No missing serial numbers. Flawless 1-to-1 extraction.',
    hi: 'कोई छूटा हुआ क्रमांक नहीं। शत-प्रतिशत पूर्ण डेटा।'
  },

  // Download Reports Modal
  reports_modal_title: {
    en: 'Download Reports & Voter Slips',
    hi: 'वोटर पर्ची व हाउसहोल्ड रिपोर्ट डाउनलोड'
  },
  reports_modal_subtitle: {
    en: 'Direct PDF Downloads',
    hi: 'सीधे PDF डाउनलोड करें'
  },
  reports_tab_ward_wise: {
    en: 'Ward Wise',
    hi: 'वार्ड अनुसार'
  },
  reports_tab_part_wise: {
    en: 'Part Wise',
    hi: 'भाग अनुसार'
  },
  reports_tab_master: {
    en: 'Master Report',
    hi: 'मास्टर रिपोर्ट'
  },
  reports_tab_other: {
    en: 'Other',
    hi: 'अन्य'
  },
  reports_select_ward_part: {
    en: 'Select Ward / Part:',
    hi: 'वार्ड / भाग चुनें:'
  },
  reports_btn_pdf: {
    en: 'Download PDF',
    hi: 'PDF डाउनलोड'
  },
  reports_btn_preview: {
    en: 'Preview HTML',
    hi: 'HTML देखें'
  },
  reports_no_reports: {
    en: 'No reports found.',
    hi: 'कोई रिपोर्ट उपलब्ध नहीं है।'
  },

  // Oath Modal
  oath_title: {
    en: 'User Declaration & Oath',
    hi: 'उपयोगकर्ता शपथ'
  },
  oath_p1: {
    en: 'By accessing this unofficial portal, I solemnly pledge that I will use this search tool responsibly and lawfully.',
    hi: 'इस अनौपचारिक पोर्टल में प्रवेश करके, मैं सत्यनिष्ठा से शपथ लेता हूँ कि मैं इस खोज उपकरण का उपयोग जिम्मेदारी और कानूनी रूप से करूंगा।'
  },
  oath_p2: {
    en: 'I affirm that I will use this tool primarily to verify my own voting details or assist others in finding their legitimate voting information. I will not misuse or exploit this public data for any malicious or commercial purpose.',
    hi: 'मैं पुष्टि करता हूँ कि मैं इस उपकरण का उपयोग मुख्य रूप से अपना नाम खोजने या दूसरों को उनके वैध मतदान विवरण खोजने में सहायता करने के लिए करूंगा। मैं किसी भी दुर्भाषापूर्ण या व्यावसायिक उद्देश्य के लिए इस सार्वजनिक डेटा का दुरुपयोग नहीं करूंगा।'
  },
  oath_accept_btn: {
    en: 'I Solemnly Affirm & Accept',
    hi: 'मैं सत्यनिष्ठा से स्वीकार करता हूँ'
  },

  // Demographics & Relations
  rel_father: {
    en: 'Father',
    hi: 'पिता'
  },
  rel_husband: {
    en: 'Husband',
    hi: 'पति'
  },
  rel_mother: {
    en: 'Mother',
    hi: 'माता'
  },
  rel_other: {
    en: 'Other',
    hi: 'अन्य'
  },
  gender_male: {
    en: 'Male',
    hi: 'पुरुष'
  },
  gender_female: {
    en: 'Female',
    hi: 'महिला'
  },
  gender_other: {
    en: 'Other',
    hi: 'अन्य'
  }
};

export function getTranslation(key: string, lang: Language): string {
  const item = (translations as any)[key];
  if (item && item[lang]) {
    return item[lang];
  }
  return key;
}

