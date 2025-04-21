'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabase';
import Image from 'next/image';
import GoogleMapComponent from '../components/GoogleMap';

function CreateEventContent() {
  const router = useRouter();
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ticketTitle, setTicketTitle] = useState('Standard Ticket');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [albumImages, setAlbumImages] = useState([]);
  const [albumImageUrls, setAlbumImageUrls] = useState([]);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [location, setLocation] = useState(null);
  const [hasEarlyBird, setHasEarlyBird] = useState(false);
  const [earlyBirdDays, setEarlyBirdDays] = useState('');
  const [earlyBirdDiscount, setEarlyBirdDiscount] = useState('');
  const [hasMultipleBuys, setHasMultipleBuys] = useState(false);
  const [multipleBuysMinTickets, setMultipleBuysMinTickets] = useState('');
  const [multipleBuysDiscount, setMultipleBuysDiscount] = useState('');
  const [isPromotionEnabled, setIsPromotionEnabled] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [eventLink, setEventLink] = useState('');
  const [earlyBirdStartDate, setEarlyBirdStartDate] = useState('');
  const [earlyBirdEndDate, setEarlyBirdEndDate] = useState('');
  
  const fileInputRef = useRef(null);
  const albumInputRef = useRef(null);

  // Ticket tiers state
  const [hasTicketTiers, setHasTicketTiers] = useState(false);
  const [ticketTiers, setTicketTiers] = useState([
    { title: '', price: '', description: '', quantity: '' }
  ]);
  
  // Function to add new ticket tier
  const addTicketTier = () => {
    setTicketTiers([...ticketTiers, { title: '', price: '', description: '', quantity: '' }]);
  };
  
  // Function to update a specific ticket tier
  const updateTicketTier = (index, field, value) => {
    const updatedTiers = [...ticketTiers];
    updatedTiers[index][field] = value;
    setTicketTiers(updatedTiers);
  };
  
  // Function to remove a ticket tier
  const removeTicketTier = (index) => {
    if (ticketTiers.length > 1) {
      const updatedTiers = [...ticketTiers];
      updatedTiers.splice(index, 1);
      setTicketTiers(updatedTiers);
    }
  };

  // Add states/provinces data object
  const statesByCountry = {
    ng: [ // Nigeria
      { value: 'AB', label: 'Abia' },
      { value: 'AD', label: 'Adamawa' },
      { value: 'AK', label: 'Akwa Ibom' },
      { value: 'AN', label: 'Anambra' },
      { value: 'BA', label: 'Bauchi' },
      { value: 'BY', label: 'Bayelsa' },
      { value: 'BE', label: 'Benue' },
      { value: 'BO', label: 'Borno' },
      { value: 'CR', label: 'Cross River' },
      { value: 'DE', label: 'Delta' },
      { value: 'EB', label: 'Ebonyi' },
      { value: 'ED', label: 'Edo' },
      { value: 'EK', label: 'Ekiti' },
      { value: 'EN', label: 'Enugu' },
      { value: 'FC', label: 'Federal Capital Territory' },
      { value: 'GO', label: 'Gombe' },
      { value: 'IM', label: 'Imo' },
      { value: 'JI', label: 'Jigawa' },
      { value: 'KD', label: 'Kaduna' },
      { value: 'KN', label: 'Kano' },
      { value: 'KT', label: 'Katsina' },
      { value: 'KE', label: 'Kebbi' },
      { value: 'KO', label: 'Kogi' },
      { value: 'KW', label: 'Kwara' },
      { value: 'LA', label: 'Lagos' },
      { value: 'NA', label: 'Nasarawa' },
      { value: 'NI', label: 'Niger' },
      { value: 'OG', label: 'Ogun' },
      { value: 'ON', label: 'Ondo' },
      { value: 'OS', label: 'Osun' },
      { value: 'OY', label: 'Oyo' },
      { value: 'PL', label: 'Plateau' },
      { value: 'RI', label: 'Rivers' },
      { value: 'SO', label: 'Sokoto' },
      { value: 'TA', label: 'Taraba' },
      { value: 'YO', label: 'Yobe' },
      { value: 'ZA', label: 'Zamfara' }
    ],
    us: [ // United States
      { value: 'AL', label: 'Alabama' },
      { value: 'AK', label: 'Alaska' },
      { value: 'AZ', label: 'Arizona' },
      { value: 'AR', label: 'Arkansas' },
      { value: 'CA', label: 'California' },
      { value: 'CO', label: 'Colorado' },
      { value: 'CT', label: 'Connecticut' },
      { value: 'DE', label: 'Delaware' },
      { value: 'FL', label: 'Florida' },
      { value: 'GA', label: 'Georgia' },
      { value: 'HI', label: 'Hawaii' },
      { value: 'ID', label: 'Idaho' },
      { value: 'IL', label: 'Illinois' },
      { value: 'IN', label: 'Indiana' },
      { value: 'IA', label: 'Iowa' },
      { value: 'KS', label: 'Kansas' },
      { value: 'KY', label: 'Kentucky' },
      { value: 'LA', label: 'Louisiana' },
      { value: 'ME', label: 'Maine' },
      { value: 'MD', label: 'Maryland' },
      { value: 'MA', label: 'Massachusetts' },
      { value: 'MI', label: 'Michigan' },
      { value: 'MN', label: 'Minnesota' },
      { value: 'MS', label: 'Mississippi' },
      { value: 'MO', label: 'Missouri' },
      { value: 'MT', label: 'Montana' },
      { value: 'NE', label: 'Nebraska' },
      { value: 'NV', label: 'Nevada' },
      { value: 'NH', label: 'New Hampshire' },
      { value: 'NJ', label: 'New Jersey' },
      { value: 'NM', label: 'New Mexico' },
      { value: 'NY', label: 'New York' },
      { value: 'NC', label: 'North Carolina' },
      { value: 'ND', label: 'North Dakota' },
      { value: 'OH', label: 'Ohio' },
      { value: 'OK', label: 'Oklahoma' },
      { value: 'OR', label: 'Oregon' },
      { value: 'PA', label: 'Pennsylvania' },
      { value: 'RI', label: 'Rhode Island' },
      { value: 'SC', label: 'South Carolina' },
      { value: 'SD', label: 'South Dakota' },
      { value: 'TN', label: 'Tennessee' },
      { value: 'TX', label: 'Texas' },
      { value: 'UT', label: 'Utah' },
      { value: 'VT', label: 'Vermont' },
      { value: 'VA', label: 'Virginia' },
      { value: 'WA', label: 'Washington' },
      { value: 'WV', label: 'West Virginia' },
      { value: 'WI', label: 'Wisconsin' },
      { value: 'WY', label: 'Wyoming' }
    ],
    ca: [ // Canada
      { value: 'AB', label: 'Alberta' },
      { value: 'BC', label: 'British Columbia' },
      { value: 'MB', label: 'Manitoba' },
      { value: 'NB', label: 'New Brunswick' },
      { value: 'NL', label: 'Newfoundland and Labrador' },
      { value: 'NS', label: 'Nova Scotia' },
      { value: 'ON', label: 'Ontario' },
      { value: 'PE', label: 'Prince Edward Island' },
      { value: 'QC', label: 'Quebec' },
      { value: 'SK', label: 'Saskatchewan' },
      { value: 'NT', label: 'Northwest Territories' },
      { value: 'NU', label: 'Nunavut' },
      { value: 'YT', label: 'Yukon' }
    ],
    gb: [ // United Kingdom
      { value: 'ENG', label: 'England' },
      { value: 'SCT', label: 'Scotland' },
      { value: 'WLS', label: 'Wales' },
      { value: 'NIR', label: 'Northern Ireland' }
    ],
    au: [ // Australia
      { value: 'NSW', label: 'New South Wales' },
      { value: 'VIC', label: 'Victoria' },
      { value: 'QLD', label: 'Queensland' },
      { value: 'WA', label: 'Western Australia' },
      { value: 'SA', label: 'South Australia' },
      { value: 'TAS', label: 'Tasmania' },
      { value: 'ACT', label: 'Australian Capital Territory' },
      { value: 'NT', label: 'Northern Territory' }
    ],
    in: [ // India
      { value: 'AP', label: 'Andhra Pradesh' },
      { value: 'AR', label: 'Arunachal Pradesh' },
      { value: 'AS', label: 'Assam' },
      { value: 'BR', label: 'Bihar' },
      { value: 'CT', label: 'Chhattisgarh' },
      { value: 'GA', label: 'Goa' },
      { value: 'GJ', label: 'Gujarat' },
      { value: 'HR', label: 'Haryana' },
      { value: 'HP', label: 'Himachal Pradesh' },
      { value: 'JH', label: 'Jharkhand' },
      { value: 'KA', label: 'Karnataka' },
      { value: 'KL', label: 'Kerala' },
      { value: 'MP', label: 'Madhya Pradesh' },
      { value: 'MH', label: 'Maharashtra' },
      { value: 'MN', label: 'Manipur' },
      { value: 'ML', label: 'Meghalaya' },
      { value: 'MZ', label: 'Mizoram' },
      { value: 'NL', label: 'Nagaland' },
      { value: 'OR', label: 'Odisha' },
      { value: 'PB', label: 'Punjab' },
      { value: 'RJ', label: 'Rajasthan' },
      { value: 'SK', label: 'Sikkim' },
      { value: 'TN', label: 'Tamil Nadu' },
      { value: 'TG', label: 'Telangana' },
      { value: 'TR', label: 'Tripura' },
      { value: 'UP', label: 'Uttar Pradesh' },
      { value: 'UT', label: 'Uttarakhand' },
      { value: 'WB', label: 'West Bengal' }
    ],
    za: [ // South Africa
      { value: 'EC', label: 'Eastern Cape' },
      { value: 'FS', label: 'Free State' },
      { value: 'GT', label: 'Gauteng' },
      { value: 'KZN', label: 'KwaZulu-Natal' },
      { value: 'LP', label: 'Limpopo' },
      { value: 'MP', label: 'Mpumalanga' },
      { value: 'NW', label: 'North West' },
      { value: 'NC', label: 'Northern Cape' },
      { value: 'WC', label: 'Western Cape' }
    ],
    br: [ // Brazil
      { value: 'AC', label: 'Acre' },
      { value: 'AL', label: 'Alagoas' },
      { value: 'AP', label: 'Amapá' },
      { value: 'AM', label: 'Amazonas' },
      { value: 'BA', label: 'Bahia' },
      { value: 'CE', label: 'Ceará' },
      { value: 'DF', label: 'Distrito Federal' },
      { value: 'ES', label: 'Espírito Santo' },
      { value: 'GO', label: 'Goiás' },
      { value: 'MA', label: 'Maranhão' },
      { value: 'MT', label: 'Mato Grosso' },
      { value: 'MS', label: 'Mato Grosso do Sul' },
      { value: 'MG', label: 'Minas Gerais' },
      { value: 'PA', label: 'Pará' },
      { value: 'PB', label: 'Paraíba' },
      { value: 'PR', label: 'Paraná' },
      { value: 'PE', label: 'Pernambuco' },
      { value: 'PI', label: 'Piauí' },
      { value: 'RJ', label: 'Rio de Janeiro' },
      { value: 'RN', label: 'Rio Grande do Norte' },
      { value: 'RS', label: 'Rio Grande do Sul' },
      { value: 'RO', label: 'Rondônia' },
      { value: 'RR', label: 'Roraima' },
      { value: 'SC', label: 'Santa Catarina' },
      { value: 'SP', label: 'São Paulo' },
      { value: 'SE', label: 'Sergipe' },
      { value: 'TO', label: 'Tocantins' }
    ],
    mx: [ // Mexico
      { value: 'AGU', label: 'Aguascalientes' },
      { value: 'BCN', label: 'Baja California' },
      { value: 'BCS', label: 'Baja California Sur' },
      { value: 'CAM', label: 'Campeche' },
      { value: 'CHP', label: 'Chiapas' },
      { value: 'CHH', label: 'Chihuahua' },
      { value: 'CMX', label: 'Ciudad de México' },
      { value: 'COA', label: 'Coahuila' },
      { value: 'COL', label: 'Colima' },
      { value: 'DUR', label: 'Durango' },
      { value: 'GUA', label: 'Guanajuato' },
      { value: 'GRO', label: 'Guerrero' },
      { value: 'HID', label: 'Hidalgo' },
      { value: 'JAL', label: 'Jalisco' },
      { value: 'MEX', label: 'México' },
      { value: 'MIC', label: 'Michoacán' },
      { value: 'MOR', label: 'Morelos' },
      { value: 'NAY', label: 'Nayarit' },
      { value: 'NLE', label: 'Nuevo León' },
      { value: 'OAX', label: 'Oaxaca' },
      { value: 'PUE', label: 'Puebla' },
      { value: 'QUE', label: 'Querétaro' },
      { value: 'ROO', label: 'Quintana Roo' },
      { value: 'SLP', label: 'San Luis Potosí' },
      { value: 'SIN', label: 'Sinaloa' },
      { value: 'SON', label: 'Sonora' },
      { value: 'TAB', label: 'Tabasco' },
      { value: 'TAM', label: 'Tamaulipas' },
      { value: 'TLA', label: 'Tlaxcala' },
      { value: 'VER', label: 'Veracruz' },
      { value: 'YUC', label: 'Yucatán' },
      { value: 'ZAC', label: 'Zacatecas' }
    ],
    fr: [ // France
      { value: 'ARA', label: 'Auvergne-Rhône-Alpes' },
      { value: 'BFC', label: 'Bourgogne-Franche-Comté' },
      { value: 'BRE', label: 'Bretagne' },
      { value: 'CVL', label: 'Centre-Val de Loire' },
      { value: 'COR', label: 'Corse' },
      { value: 'GES', label: 'Grand Est' },
      { value: 'HDF', label: 'Hauts-de-France' },
      { value: 'IDF', label: 'Île-de-France' },
      { value: 'NOR', label: 'Normandie' },
      { value: 'NAQ', label: 'Nouvelle-Aquitaine' },
      { value: 'OCC', label: 'Occitanie' },
      { value: 'PDL', label: 'Pays de la Loire' },
      { value: 'PAC', label: "Provence-Alpes-Côte d'Azur" }
    ],
    de: [ // Germany
      { value: 'BW', label: 'Baden-Württemberg' },
      { value: 'BY', label: 'Bayern' },
      { value: 'BE', label: 'Berlin' },
      { value: 'BB', label: 'Brandenburg' },
      { value: 'HB', label: 'Bremen' },
      { value: 'HH', label: 'Hamburg' },
      { value: 'HE', label: 'Hessen' },
      { value: 'MV', label: 'Mecklenburg-Vorpommern' },
      { value: 'NI', label: 'Niedersachsen' },
      { value: 'NW', label: 'Nordrhein-Westfalen' },
      { value: 'RP', label: 'Rheinland-Pfalz' },
      { value: 'SL', label: 'Saarland' },
      { value: 'SN', label: 'Sachsen' },
      { value: 'ST', label: 'Sachsen-Anhalt' },
      { value: 'SH', label: 'Schleswig-Holstein' },
      { value: 'TH', label: 'Thüringen' }
    ],
    es: [ // Spain
      { value: 'AN', label: 'Andalucía' },
      { value: 'AR', label: 'Aragón' },
      { value: 'AS', label: 'Asturias' },
      { value: 'CN', label: 'Canarias' },
      { value: 'CB', label: 'Cantabria' },
      { value: 'CL', label: 'Castilla y León' },
      { value: 'CM', label: 'Castilla-La Mancha' },
      { value: 'CT', label: 'Cataluña' },
      { value: 'EX', label: 'Extremadura' },
      { value: 'GA', label: 'Galicia' },
      { value: 'IB', label: 'Islas Baleares' },
      { value: 'RI', label: 'La Rioja' },
      { value: 'MD', label: 'Madrid' },
      { value: 'MC', label: 'Murcia' },
      { value: 'NC', label: 'Navarra' },
      { value: 'PV', label: 'País Vasco' },
      { value: 'VC', label: 'Valenciana' }
    ],
    it: [ // Italy
      { value: 'ABR', label: 'Abruzzo' },
      { value: 'BAS', label: 'Basilicata' },
      { value: 'CAL', label: 'Calabria' },
      { value: 'CAM', label: 'Campania' },
      { value: 'EMR', label: 'Emilia-Romagna' },
      { value: 'FVG', label: 'Friuli Venezia Giulia' },
      { value: 'LAZ', label: 'Lazio' },
      { value: 'LIG', label: 'Liguria' },
      { value: 'LOM', label: 'Lombardia' },
      { value: 'MAR', label: 'Marche' },
      { value: 'MOL', label: 'Molise' },
      { value: 'PIE', label: 'Piemonte' },
      { value: 'PUG', label: 'Puglia' },
      { value: 'SAR', label: 'Sardegna' },
      { value: 'SIC', label: 'Sicilia' },
      { value: 'TOS', label: 'Toscana' },
      { value: 'TAA', label: 'Trentino-Alto Adige' },
      { value: 'UMB', label: 'Umbria' },
      { value: 'VDA', label: "Valle d'Aosta" },
      { value: 'VEN', label: 'Veneto' }
    ],
    jp: [ // Japan
      { value: 'HKD', label: 'Hokkaido' },
      { value: 'AOM', label: 'Aomori' },
      { value: 'IWT', label: 'Iwate' },
      { value: 'MYG', label: 'Miyagi' },
      { value: 'AKT', label: 'Akita' },
      { value: 'YGT', label: 'Yamagata' },
      { value: 'FKS', label: 'Fukushima' },
      { value: 'IBR', label: 'Ibaraki' },
      { value: 'TCG', label: 'Tochigi' },
      { value: 'GNM', label: 'Gunma' },
      { value: 'STM', label: 'Saitama' },
      { value: 'CHB', label: 'Chiba' },
      { value: 'TKY', label: 'Tokyo' },
      { value: 'KNG', label: 'Kanagawa' },
      { value: 'NGT', label: 'Niigata' },
      { value: 'TYM', label: 'Toyama' },
      { value: 'ISK', label: 'Ishikawa' },
      { value: 'FKI', label: 'Fukui' },
      { value: 'YMN', label: 'Yamanashi' },
      { value: 'NGN', label: 'Nagano' },
      { value: 'GIF', label: 'Gifu' },
      { value: 'SZK', label: 'Shizuoka' },
      { value: 'AIC', label: 'Aichi' },
      { value: 'MIE', label: 'Mie' },
      { value: 'SIG', label: 'Shiga' },
      { value: 'KYT', label: 'Kyoto' },
      { value: 'OSK', label: 'Osaka' },
      { value: 'HYG', label: 'Hyogo' },
      { value: 'NRA', label: 'Nara' },
      { value: 'WKY', label: 'Wakayama' },
      { value: 'TTR', label: 'Tottori' },
      { value: 'SMN', label: 'Shimane' },
      { value: 'OKY', label: 'Okayama' },
      { value: 'HRS', label: 'Hiroshima' },
      { value: 'YGC', label: 'Yamaguchi' },
      { value: 'TKS', label: 'Tokushima' },
      { value: 'KGW', label: 'Kagawa' },
      { value: 'EHM', label: 'Ehime' },
      { value: 'KOC', label: 'Kochi' },
      { value: 'FKO', label: 'Fukuoka' },
      { value: 'SAG', label: 'Saga' },
      { value: 'NGS', label: 'Nagasaki' },
      { value: 'KUM', label: 'Kumamoto' },
      { value: 'OIT', label: 'Oita' },
      { value: 'MYZ', label: 'Miyazaki' },
      { value: 'KGS', label: 'Kagoshima' },
      { value: 'OKN', label: 'Okinawa' }
    ],
    eg: [ // Egypt
      { value: 'CAI', label: 'Cairo' },
      { value: 'ALX', label: 'Alexandria' },
      { value: 'ASN', label: 'Aswan' },
      { value: 'AST', label: 'Asyut' },
      { value: 'BNS', label: 'Beni Suef' },
      { value: 'GZ', label: 'Giza' },
      { value: 'ISM', label: 'Ismailia' },
      { value: 'LX', label: 'Luxor' },
      { value: 'MT', label: 'Matrouh' }
    ],
    ke: [ // Kenya
      { value: 'NBI', label: 'Nairobi' },
      { value: 'MSA', label: 'Mombasa' },
      { value: 'KSM', label: 'Kisumu' },
      { value: 'NKU', label: 'Nakuru' },
      { value: 'ELD', label: 'Eldoret' }
    ],
    gh: [ // Ghana
      { value: 'AC', label: 'Ashanti' },
      { value: 'BA', label: 'Brong-Ahafo' },
      { value: 'CE', label: 'Central' },
      { value: 'EA', label: 'Eastern' },
      { value: 'GA', label: 'Greater Accra' },
      { value: 'NO', label: 'Northern' },
      { value: 'UE', label: 'Upper East' },
      { value: 'UW', label: 'Upper West' },
      { value: 'VO', label: 'Volta' },
      { value: 'WE', label: 'Western' }
    ],
    et: [ // Ethiopia
      { value: 'AA', label: 'Addis Ababa' },
      { value: 'AF', label: 'Afar' },
      { value: 'AM', label: 'Amhara' },
      { value: 'OR', label: 'Oromia' },
      { value: 'SO', label: 'Somali' },
      { value: 'TI', label: 'Tigray' }
    ],
    ar: [ // Argentina
      { value: 'BA', label: 'Buenos Aires' },
      { value: 'CT', label: 'Catamarca' },
      { value: 'CH', label: 'Chaco' },
      { value: 'CB', label: 'Córdoba' },
      { value: 'CR', label: 'Corrientes' },
      { value: 'ER', label: 'Entre Ríos' },
      { value: 'FO', label: 'Formosa' },
      { value: 'JY', label: 'Jujuy' },
      { value: 'LP', label: 'La Pampa' },
      { value: 'LR', label: 'La Rioja' },
      { value: 'MZ', label: 'Mendoza' },
      { value: 'MI', label: 'Misiones' },
      { value: 'NQ', label: 'Neuquén' },
      { value: 'RN', label: 'Río Negro' },
      { value: 'SA', label: 'Salta' },
      { value: 'SJ', label: 'San Juan' },
      { value: 'SL', label: 'San Luis' },
      { value: 'SC', label: 'Santa Cruz' },
      { value: 'SF', label: 'Santa Fe' },
      { value: 'SE', label: 'Santiago del Estero' },
      { value: 'TF', label: 'Tierra del Fuego' },
      { value: 'TU', label: 'Tucumán' }
    ],
    cn: [ // China
      { value: 'BJ', label: 'Beijing' },
      { value: 'SH', label: 'Shanghai' },
      { value: 'CQ', label: 'Chongqing' },
      { value: 'GD', label: 'Guangdong' },
      { value: 'JS', label: 'Jiangsu' },
      { value: 'SD', label: 'Shandong' },
      { value: 'ZJ', label: 'Zhejiang' }
    ],
    ae: [ // UAE
      { value: 'ABU', label: 'Abu Dhabi' },
      { value: 'AJM', label: 'Ajman' },
      { value: 'DXB', label: 'Dubai' },
      { value: 'FUJ', label: 'Fujairah' },
      { value: 'RAK', label: 'Ras Al Khaimah' },
      { value: 'SHJ', label: 'Sharjah' },
      { value: 'UMM', label: 'Umm Al Quwain' }
    ],
    sa: [ // Saudi Arabia
      { value: 'RD', label: 'Riyadh' },
      { value: 'MK', label: 'Makkah' },
      { value: 'MD', label: 'Medina' },
      { value: 'EP', label: 'Eastern Province' },
      { value: 'AS', label: 'Asir' },
      { value: 'TB', label: 'Tabuk' }
    ],
    // Additional African Countries
    tz: [ // Tanzania
      { value: 'AR', label: 'Arusha' },
      { value: 'DS', label: 'Dar es Salaam' },
      { value: 'DO', label: 'Dodoma' },
      { value: 'IR', label: 'Iringa' },
      { value: 'KG', label: 'Kagera' },
      { value: 'KR', label: 'Kilimanjaro' },
      { value: 'MB', label: 'Mbeya' },
      { value: 'MO', label: 'Morogoro' },
      { value: 'MT', label: 'Mtwara' },
      { value: 'MW', label: 'Mwanza' },
      { value: 'PM', label: 'Pemba' },
      { value: 'PW', label: 'Pwani' },
      { value: 'RK', label: 'Rukwa' },
      { value: 'RV', label: 'Ruvuma' },
      { value: 'SH', label: 'Shinyanga' },
      { value: 'SI', label: 'Singida' },
      { value: 'TB', label: 'Tabora' },
      { value: 'TN', label: 'Tanga' },
      { value: 'ZN', label: 'Zanzibar' }
    ],
    ug: [ // Uganda
      { value: 'CEN', label: 'Central Region' },
      { value: 'EAS', label: 'Eastern Region' },
      { value: 'NOR', label: 'Northern Region' },
      { value: 'WES', label: 'Western Region' },
      { value: 'KLA', label: 'Kampala' },
      { value: 'WKO', label: 'Wakiso' },
      { value: 'MBR', label: 'Mbarara' },
      { value: 'GUL', label: 'Gulu' }
    ],
    ci: [ // Côte d'Ivoire
      { value: 'AB', label: 'Abidjan' },
      { value: 'BS', label: 'Bas-Sassandra' },
      { value: 'CM', label: 'Comoé' },
      { value: 'DN', label: 'Denguélé' },
      { value: 'GD', label: 'Gôh-Djiboua' },
      { value: 'LC', label: 'Lacs' },
      { value: 'LG', label: 'Lagunes' },
      { value: 'MG', label: 'Montagnes' },
      { value: 'SM', label: 'Sassandra-Marahoué' },
      { value: 'SV', label: 'Savanes' },
      { value: 'VB', label: 'Vallée du Bandama' },
      { value: 'WR', label: 'Woroba' },
      { value: 'ZZ', label: 'Zanzan' }
    ],
    cm: [ // Cameroon
      { value: 'AD', label: 'Adamawa' },
      { value: 'CE', label: 'Centre' },
      { value: 'EN', label: 'Far North' },
      { value: 'ES', label: 'East' },
      { value: 'LT', label: 'Littoral' },
      { value: 'NO', label: 'North' },
      { value: 'NW', label: 'North-West' },
      { value: 'OU', label: 'West' },
      { value: 'SU', label: 'South' },
      { value: 'SW', label: 'South-West' }
    ],
    cd: [ // Democratic Republic of the Congo
      { value: 'BN', label: 'Bandundu' },
      { value: 'BC', label: 'Bas-Congo' },
      { value: 'EQ', label: 'Équateur' },
      { value: 'KA', label: 'Kasai-Occidental' },
      { value: 'KE', label: 'Kasai-Oriental' },
      { value: 'KT', label: 'Katanga' },
      { value: 'KN', label: 'Kinshasa' },
      { value: 'MN', label: 'Maniema' },
      { value: 'NK', label: 'Nord-Kivu' },
      { value: 'OR', label: 'Orientale' },
      { value: 'SK', label: 'Sud-Kivu' }
    ],
    cg: [ // Republic of the Congo
      { value: 'BZV', label: 'Brazzaville' },
      { value: 'BOU', label: 'Bouenza' },
      { value: 'CUV', label: 'Cuvette' },
      { value: 'KOU', label: 'Kouilou' },
      { value: 'LEK', label: 'Lékoumou' },
      { value: 'LIK', label: 'Likouala' },
      { value: 'NIA', label: 'Niari' },
      { value: 'PLT', label: 'Plateaux' },
      { value: 'POO', label: 'Pool' },
      { value: 'SAN', label: 'Sangha' }
    ],
    ga: [ // Gabon
      { value: 'ES', label: 'Estuaire' },
      { value: 'HO', label: 'Haut-Ogooué' },
      { value: 'MO', label: 'Moyen-Ogooué' },
      { value: 'NG', label: 'Ngounié' },
      { value: 'NY', label: 'Nyanga' },
      { value: 'OI', label: 'Ogooué-Ivindo' },
      { value: 'OL', label: 'Ogooué-Lolo' },
      { value: 'OM', label: 'Ogooué-Maritime' },
      { value: 'WN', label: 'Woleu-Ntem' }
    ],
    ao: [ // Angola
      { value: 'BGO', label: 'Bengo' },
      { value: 'BGL', label: 'Benguela' },
      { value: 'BIE', label: 'Bié' },
      { value: 'CAB', label: 'Cabinda' },
      { value: 'CNN', label: 'Cunene' },
      { value: 'HUA', label: 'Huambo' },
      { value: 'HUI', label: 'Huíla' },
      { value: 'LUA', label: 'Luanda' },
      { value: 'LNO', label: 'Lunda Norte' },
      { value: 'LSU', label: 'Lunda Sul' },
      { value: 'MAL', label: 'Malange' },
      { value: 'MOX', label: 'Moxico' },
      { value: 'NAM', label: 'Namibe' },
      { value: 'UIG', label: 'Uíge' },
      { value: 'ZAI', label: 'Zaire' }
    ],
    zm: [ // Zambia
      { value: 'CE', label: 'Central' },
      { value: 'CO', label: 'Copperbelt' },
      { value: 'EA', label: 'Eastern' },
      { value: 'LP', label: 'Luapula' },
      { value: 'LK', label: 'Lusaka' },
      { value: 'MU', label: 'Muchinga' },
      { value: 'NW', label: 'North-Western' },
      { value: 'NO', label: 'Northern' },
      { value: 'SO', label: 'Southern' },
      { value: 'WE', label: 'Western' }
    ],
    mw: [ // Malawi
      { value: 'BA', label: 'Balaka' },
      { value: 'BL', label: 'Blantyre' },
      { value: 'CK', label: 'Chikwawa' },
      { value: 'CR', label: 'Chiradzulu' },
      { value: 'DE', label: 'Dedza' },
      { value: 'DO', label: 'Dowa' },
      { value: 'KR', label: 'Karonga' },
      { value: 'KS', label: 'Kasungu' },
      { value: 'LI', label: 'Lilongwe' },
      { value: 'MH', label: 'Machinga' },
      { value: 'MG', label: 'Mangochi' },
      { value: 'MC', label: 'Mchinji' },
      { value: 'MU', label: 'Mulanje' },
      { value: 'MW', label: 'Mwanza' },
      { value: 'MZ', label: 'Mzimba' },
      { value: 'NB', label: 'Nkhata Bay' },
      { value: 'NK', label: 'Nkhotakota' },
      { value: 'NS', label: 'Nsanje' },
      { value: 'NU', label: 'Ntcheu' },
      { value: 'NI', label: 'Ntchisi' },
      { value: 'PH', label: 'Phalombe' },
      { value: 'RU', label: 'Rumphi' },
      { value: 'SA', label: 'Salima' },
      { value: 'TH', label: 'Thyolo' },
      { value: 'ZO', label: 'Zomba' }
    ],
    mz: [ // Mozambique
      { value: 'CD', label: 'Cabo Delgado' },
      { value: 'GZ', label: 'Gaza' },
      { value: 'IN', label: 'Inhambane' },
      { value: 'MN', label: 'Manica' },
      { value: 'MP', label: 'Maputo Province' },
      { value: 'MC', label: 'Maputo City' },
      { value: 'NM', label: 'Nampula' },
      { value: 'NS', label: 'Niassa' },
      { value: 'SF', label: 'Sofala' },
      { value: 'TT', label: 'Tete' },
      { value: 'ZB', label: 'Zambézia' }
    ],
    zw: [ // Zimbabwe
      { value: 'BU', label: 'Bulawayo' },
      { value: 'HA', label: 'Harare' },
      { value: 'MA', label: 'Manicaland' },
      { value: 'MC', label: 'Mashonaland Central' },
      { value: 'ME', label: 'Mashonaland East' },
      { value: 'MW', label: 'Mashonaland West' },
      { value: 'MV', label: 'Masvingo' },
      { value: 'MN', label: 'Matabeleland North' },
      { value: 'MS', label: 'Matabeleland South' },
      { value: 'MI', label: 'Midlands' }
    ],
    // Additional Asian Countries
    kr: [ // South Korea
      { value: 'SL', label: 'Seoul' },
      { value: 'BS', label: 'Busan' },
      { value: 'DG', label: 'Daegu' },
      { value: 'IC', label: 'Incheon' },
      { value: 'GJ', label: 'Gwangju' },
      { value: 'DJ', label: 'Daejeon' },
      { value: 'US', label: 'Ulsan' },
      { value: 'GG', label: 'Gyeonggi' },
      { value: 'GW', label: 'Gangwon' },
      { value: 'CB', label: 'Chungbuk' },
      { value: 'CN', label: 'Chungnam' },
      { value: 'JB', label: 'Jeonbuk' },
      { value: 'JN', label: 'Jeonnam' },
      { value: 'GB', label: 'Gyeongbuk' },
      { value: 'GN', label: 'Gyeongnam' },
      { value: 'JJ', label: 'Jeju' }
    ],
    sg: [ // Singapore - Regions
      { value: 'CR', label: 'Central Region' },
      { value: 'ER', label: 'East Region' },
      { value: 'NR', label: 'North Region' },
      { value: 'NER', label: 'North-East Region' },
      { value: 'WR', label: 'West Region' }
    ],
    my: [ // Malaysia
      { value: 'JHR', label: 'Johor' },
      { value: 'KDH', label: 'Kedah' },
      { value: 'KTN', label: 'Kelantan' },
      { value: 'MLK', label: 'Melaka' },
      { value: 'NSN', label: 'Negeri Sembilan' },
      { value: 'PHG', label: 'Pahang' },
      { value: 'PNG', label: 'Penang' },
      { value: 'PRK', label: 'Perak' },
      { value: 'PLS', label: 'Perlis' },
      { value: 'SBH', label: 'Sabah' },
      { value: 'SWK', label: 'Sarawak' },
      { value: 'SGR', label: 'Selangor' },
      { value: 'TRG', label: 'Terengganu' },
      { value: 'KUL', label: 'Kuala Lumpur' },
      { value: 'LBN', label: 'Labuan' },
      { value: 'PJY', label: 'Putrajaya' }
    ],
    // Central American Countries
    sv: [ // El Salvador
      { value: 'AH', label: 'Ahuachapán' },
      { value: 'CA', label: 'Cabañas' },
      { value: 'CH', label: 'Chalatenango' },
      { value: 'CU', label: 'Cuscatlán' },
      { value: 'LI', label: 'La Libertad' },
      { value: 'PA', label: 'La Paz' },
      { value: 'UN', label: 'La Unión' },
      { value: 'MO', label: 'Morazán' },
      { value: 'SM', label: 'San Miguel' },
      { value: 'SS', label: 'San Salvador' },
      { value: 'SV', label: 'San Vicente' },
      { value: 'SA', label: 'Santa Ana' },
      { value: 'SO', label: 'Sonsonate' },
      { value: 'US', label: 'Usulután' }
    ],
    hn: [ // Honduras
      { value: 'AT', label: 'Atlántida' },
      { value: 'CH', label: 'Choluteca' },
      { value: 'CL', label: 'Colón' },
      { value: 'CM', label: 'Comayagua' },
      { value: 'CP', label: 'Copán' },
      { value: 'CR', label: 'Cortés' },
      { value: 'EP', label: 'El Paraíso' },
      { value: 'FM', label: 'Francisco Morazán' },
      { value: 'GD', label: 'Gracias a Dios' },
      { value: 'IN', label: 'Intibucá' },
      { value: 'IB', label: 'Islas de la Bahía' },
      { value: 'LP', label: 'La Paz' },
      { value: 'LM', label: 'Lempira' },
      { value: 'OC', label: 'Ocotepeque' },
      { value: 'OL', label: 'Olancho' },
      { value: 'SB', label: 'Santa Bárbara' },
      { value: 'VA', label: 'Valle' },
      { value: 'YO', label: 'Yoro' }
    ],
    ni: [ // Nicaragua
      { value: 'BO', label: 'Boaco' },
      { value: 'CA', label: 'Carazo' },
      { value: 'CI', label: 'Chinandega' },
      { value: 'CO', label: 'Chontales' },
      { value: 'ES', label: 'Estelí' },
      { value: 'GR', label: 'Granada' },
      { value: 'JI', label: 'Jinotega' },
      { value: 'LE', label: 'León' },
      { value: 'MD', label: 'Madriz' },
      { value: 'MN', label: 'Managua' },
      { value: 'MS', label: 'Masaya' },
      { value: 'MT', label: 'Matagalpa' },
      { value: 'NS', label: 'Nueva Segovia' },
      { value: 'SJ', label: 'Río San Juan' },
      { value: 'RI', label: 'Rivas' },
      { value: 'AN', label: 'Atlántico Norte' },
      { value: 'AS', label: 'Atlántico Sur' }
    ],
    bz: [ // Belize
      { value: 'BZ', label: 'Belize' },
      { value: 'CY', label: 'Cayo' },
      { value: 'CZL', label: 'Corozal' },
      { value: 'OW', label: 'Orange Walk' },
      { value: 'SC', label: 'Stann Creek' },
      { value: 'TOL', label: 'Toledo' }
    ],
    pa: [ // Panama
      { value: 'BC', label: 'Bocas del Toro' },
      { value: 'CH', label: 'Chiriquí' },
      { value: 'CC', label: 'Coclé' },
      { value: 'CL', label: 'Colón' },
      { value: 'DR', label: 'Darién' },
      { value: 'HE', label: 'Herrera' },
      { value: 'LS', label: 'Los Santos' },
      { value: 'PA', label: 'Panamá' },
      { value: 'VR', label: 'Veraguas' },
      { value: 'EM', label: 'Emberá' },
      { value: 'KY', label: 'Guna Yala' },
      { value: 'NB', label: 'Ngöbe-Buglé' }
    ],
    cr: [ // Costa Rica
      { value: 'SJ', label: 'San José' },
      { value: 'AL', label: 'Alajuela' },
      { value: 'CA', label: 'Cartago' },
      { value: 'HE', label: 'Heredia' },
      { value: 'GU', label: 'Guanacaste' },
      { value: 'PU', label: 'Puntarenas' },
      { value: 'LI', label: 'Limón' }
    ],
    gt: [ // Guatemala
      { value: 'AV', label: 'Alta Verapaz' },
      { value: 'BV', label: 'Baja Verapaz' },
      { value: 'CM', label: 'Chimaltenango' },
      { value: 'CQ', label: 'Chiquimula' },
      { value: 'PR', label: 'El Progreso' },
      { value: 'ES', label: 'Escuintla' },
      { value: 'GU', label: 'Guatemala' },
      { value: 'HU', label: 'Huehuetenango' },
      { value: 'IZ', label: 'Izabal' },
      { value: 'JA', label: 'Jalapa' },
      { value: 'JU', label: 'Jutiapa' },
      { value: 'PE', label: 'Petén' },
      { value: 'QZ', label: 'Quetzaltenango' },
      { value: 'QC', label: 'Quiché' },
      { value: 'RE', label: 'Retalhuleu' },
      { value: 'SA', label: 'Sacatepéquez' },
      { value: 'SM', label: 'San Marcos' },
      { value: 'SR', label: 'Santa Rosa' },
      { value: 'SO', label: 'Sololá' },
      { value: 'SU', label: 'Suchitepéquez' },
      { value: 'TO', label: 'Totonicapán' },
      { value: 'ZA', label: 'Zacapa' }
    ],
    // Caribbean Countries
    jm: [ // Jamaica
      { value: 'KIN', label: 'Kingston' },
      { value: 'STH', label: 'Saint Thomas' },
      { value: 'POR', label: 'Portland' },
      { value: 'STA', label: 'Saint Andrew' },
      { value: 'STC', label: 'Saint Catherine' },
      { value: 'STM', label: 'Saint Mary' },
      { value: 'STE', label: 'Saint Elizabeth' },
      { value: 'TRL', label: 'Trelawny' },
      { value: 'STJ', label: 'Saint James' },
      { value: 'HAN', label: 'Hanover' },
      { value: 'WES', label: 'Westmoreland' },
      { value: 'MAN', label: 'Manchester' },
      { value: 'CLA', label: 'Clarendon' },
      { value: 'STN', label: 'Saint Ann' }
    ],
    bs: [ // Bahamas
      { value: 'ABA', label: 'Abaco' },
      { value: 'AND', label: 'Andros' },
      { value: 'BER', label: 'Berry Islands' },
      { value: 'BIM', label: 'Bimini' },
      { value: 'CAT', label: 'Cat Island' },
      { value: 'ELE', label: 'Eleuthera' },
      { value: 'EXU', label: 'Exuma' },
      { value: 'GBA', label: 'Grand Bahama' },
      { value: 'INA', label: 'Inagua' },
      { value: 'LIS', label: 'Long Island' },
      { value: 'MAY', label: 'Mayaguana' },
      { value: 'NAS', label: 'New Providence' },
      { value: 'RAG', label: 'Ragged Island' },
      { value: 'RUM', label: 'Rum Cay' },
      { value: 'SAL', label: 'San Salvador' }
    ],
    tt: [ // Trinidad and Tobago
      { value: 'ARI', label: 'Arima' },
      { value: 'CHA', label: 'Chaguanas' },
      { value: 'CTT', label: 'Couva-Tabaquite-Talparo' },
      { value: 'DMN', label: 'Diego Martin' },
      { value: 'ETO', label: 'Eastern Tobago' },
      { value: 'PED', label: 'Penal-Debe' },
      { value: 'POS', label: 'Port of Spain' },
      { value: 'PTF', label: 'Point Fortin' },
      { value: 'PRI', label: 'Princes Town' },
      { value: 'RCM', label: 'Rio Claro-Mayaro' },
      { value: 'SFO', label: 'San Fernando' },
      { value: 'SJL', label: 'San Juan-Laventille' },
      { value: 'SGE', label: 'Sangre Grande' },
      { value: 'SIP', label: 'Siparia' },
      { value: 'TUN', label: 'Tunapuna-Piarco' },
      { value: 'WTO', label: 'Western Tobago' }
    ],
    do: [ // Dominican Republic
      { value: 'AZU', label: 'Azua' },
      { value: 'BAO', label: 'Baoruco' },
      { value: 'BAR', label: 'Barahona' },
      { value: 'DAJ', label: 'Dajabón' },
      { value: 'DUA', label: 'Duarte' },
      { value: 'ELS', label: 'El Seibo' },
      { value: 'ESP', label: 'Espaillat' },
      { value: 'HAM', label: 'Hato Mayor' },
      { value: 'HER', label: 'Hermanas Mirabal' },
      { value: 'IND', label: 'Independencia' },
      { value: 'LAA', label: 'La Altagracia' },
      { value: 'LAR', label: 'La Romana' },
      { value: 'LAV', label: 'La Vega' },
      { value: 'MAR', label: 'María Trinidad Sánchez' },
      { value: 'MTS', label: 'Monseñor Nouel' },
      { value: 'MON', label: 'Monte Cristi' },
      { value: 'MPL', label: 'Monte Plata' },
      { value: 'PED', label: 'Pedernales' },
      { value: 'PER', label: 'Peravia' },
      { value: 'PPP', label: 'Puerto Plata' },
      { value: 'SAM', label: 'Samaná' },
      { value: 'SAN', label: 'Sánchez Ramírez' },
      { value: 'SCR', label: 'San Cristóbal' },
      { value: 'SJO', label: 'San José de Ocoa' },
      { value: 'SJU', label: 'San Juan' },
      { value: 'SPM', label: 'San Pedro de Macorís' },
      { value: 'SAN', label: 'Santiago' },
      { value: 'SRO', label: 'Santiago Rodríguez' },
      { value: 'SDF', label: 'Santo Domingo' },
      { value: 'VAL', label: 'Valverde' },
      { value: 'NDN', label: 'Distrito Nacional' }
    ],
    cu: [ // Cuba
      { value: 'PRI', label: 'Pinar del Río' },
      { value: 'ART', label: 'Artemisa' },
      { value: 'HAV', label: 'La Habana' },
      { value: 'MAY', label: 'Mayabeque' },
      { value: 'MAT', label: 'Matanzas' },
      { value: 'CFG', label: 'Cienfuegos' },
      { value: 'VCL', label: 'Villa Clara' },
      { value: 'SSP', label: 'Sancti Spíritus' },
      { value: 'CAV', label: 'Ciego de Ávila' },
      { value: 'CMG', label: 'Camagüey' },
      { value: 'LTU', label: 'Las Tunas' },
      { value: 'GRA', label: 'Granma' },
      { value: 'HOL', label: 'Holguín' },
      { value: 'SCU', label: 'Santiago de Cuba' },
      { value: 'GTM', label: 'Guantánamo' },
      { value: 'IJV', label: 'Isla de la Juventud' }
    ],
    ht: [ // Haiti
      { value: 'ART', label: 'Artibonite' },
      { value: 'CEN', label: 'Centre' },
      { value: 'GA', label: "Grand'Anse" },
      { value: 'NP', label: 'Nord' },
      { value: 'NE', label: 'Nord-Est' },
      { value: 'NO', label: 'Nord-Ouest' },
      { value: 'OU', label: 'Ouest' },
      { value: 'SD', label: 'Sud' },
      { value: 'SE', label: 'Sud-Est' },
      { value: 'NI', label: 'Nippes' }
    ],
    bb: [ // Barbados
      { value: 'CC', label: 'Christ Church' },
      { value: 'SA', label: 'Saint Andrew' },
      { value: 'SG', label: 'Saint George' },
      { value: 'SJ', label: 'Saint James' },
      { value: 'SN', label: 'Saint John' },
      { value: 'SL', label: 'Saint Lucy' },
      { value: 'SM', label: 'Saint Michael' },
      { value: 'SP', label: 'Saint Peter' },
      { value: 'SPP', label: 'Saint Philip' },
      { value: 'ST', label: 'Saint Thomas' },
      { value: 'BR', label: 'Bridgetown' }
    ],
    pr: [ // Puerto Rico
      { value: 'ADB', label: 'Adjuntas' },
      { value: 'AGD', label: 'Aguada' },
      { value: 'AGL', label: 'Aguadilla' },
      { value: 'AGS', label: 'Aguas Buenas' },
      { value: 'ABN', label: 'Aibonito' },
      { value: 'ANS', label: 'Añasco' },
      { value: 'ARC', label: 'Arecibo' },
      { value: 'ARY', label: 'Arroyo' },
      { value: 'BJA', label: 'Barceloneta' },
      { value: 'BRN', label: 'Barranquitas' },
      { value: 'BAY', label: 'Bayamón' },
      { value: 'CAB', label: 'Cabo Rojo' },
      { value: 'CAG', label: 'Caguas' },
      { value: 'CAM', label: 'Camuy' },
      { value: 'CAN', label: 'Canóvanas' },
      { value: 'CAR', label: 'Carolina' },
      { value: 'CRZ', label: 'Cataño' },
      { value: 'CAY', label: 'Cayey' },
      { value: 'CBA', label: 'Ceiba' },
      { value: 'CIL', label: 'Ciales' },
      { value: 'CID', label: 'Cidra' },
      { value: 'COA', label: 'Coamo' },
      { value: 'COM', label: 'Comerío' },
      { value: 'COZ', label: 'Corozal' },
      { value: 'CUL', label: 'Culebra' },
      { value: 'DOD', label: 'Dorado' },
      { value: 'FAJ', label: 'Fajardo' },
      { value: 'FLO', label: 'Florida' },
      { value: 'GUC', label: 'Guánica' },
      { value: 'GUY', label: 'Guayama' },
      { value: 'GUN', label: 'Guayanilla' },
      { value: 'GBO', label: 'Guaynabo' },
      { value: 'GRB', label: 'Gurabo' },
      { value: 'HAT', label: 'Hatillo' },
      { value: 'HOR', label: 'Hormigueros' },
      { value: 'HUM', label: 'Humacao' },
      { value: 'ISB', label: 'Isabela' },
      { value: 'JAY', label: 'Jayuya' },
      { value: 'JCD', label: 'Juana Díaz' },
      { value: 'JNC', label: 'Juncos' },
      { value: 'LAJ', label: 'Lajas' },
      { value: 'LAR', label: 'Lares' },
      { value: 'LAS', label: 'Las Marías' },
      { value: 'LPD', label: 'Las Piedras' },
      { value: 'LOZ', label: 'Loíza' },
      { value: 'LQU', label: 'Luquillo' },
      { value: 'MAN', label: 'Manatí' },
      { value: 'MAR', label: 'Maricao' },
      { value: 'MAU', label: 'Maunabo' },
      { value: 'MAY', label: 'Mayagüez' },
      { value: 'MOC', label: 'Moca' },
      { value: 'MOR', label: 'Morovis' },
      { value: 'NAG', label: 'Naguabo' },
      { value: 'NAR', label: 'Naranjito' },
      { value: 'ORO', label: 'Orocovis' },
      { value: 'PAT', label: 'Patillas' },
      { value: 'PEÑ', label: 'Peñuelas' },
      { value: 'PON', label: 'Ponce' },
      { value: 'QUE', label: 'Quebradillas' },
      { value: 'RNG', label: 'Rincón' },
      { value: 'RGR', label: 'Río Grande' },
      { value: 'SAB', label: 'Sabana Grande' },
      { value: 'SAL', label: 'Salinas' },
      { value: 'SGR', label: 'San Germán' },
      { value: 'SJU', label: 'San Juan' },
      { value: 'SLO', label: 'San Lorenzo' },
      { value: 'SSE', label: 'San Sebastián' },
      { value: 'SAI', label: 'Santa Isabel' },
      { value: 'TOA', label: 'Toa Alta' },
      { value: 'TOB', label: 'Toa Baja' },
      { value: 'TRJ', label: 'Trujillo Alto' },
      { value: 'UTD', label: 'Utuado' },
      { value: 'VEG', label: 'Vega Alta' },
      { value: 'VBJ', label: 'Vega Baja' },
      { value: 'VQS', label: 'Vieques' },
      { value: 'VLL', label: 'Villalba' },
      { value: 'YAB', label: 'Yabucoa' },
      { value: 'YAU', label: 'Yauco' }
    ],
    // Additional Middle Eastern Countries
    qa: [ // Qatar
      { value: 'DA', label: 'Ad Dawhah' },
      { value: 'KH', label: 'Al Khor' },
      { value: 'WA', label: 'Al Wakrah' },
      { value: 'RA', label: 'Ar Rayyan' },
      { value: 'MS', label: 'Madinat ash Shamal' },
      { value: 'ZA', label: 'Az Zaayan' },
      { value: 'US', label: 'Umm Salal' },
      { value: 'SH', label: 'Ash Shamal' }
    ],
    kw: [ // Kuwait
      { value: 'AH', label: 'Al Ahmadi' },
      { value: 'FA', label: 'Al Farwaniyah' },
      { value: 'JA', label: 'Al Jahra' },
      { value: 'KU', label: 'Al Asimah' },
      { value: 'HA', label: 'Hawalli' },
      { value: 'MU', label: 'Mubarak Al-Kabeer' }
    ],
    bh: [ // Bahrain
      { value: 'CAP', label: 'Capital Governorate' },
      { value: 'MUH', label: 'Muharraq Governorate' },
      { value: 'NOR', label: 'Northern Governorate' },
      { value: 'SOU', label: 'Southern Governorate' }
    ],
    ae: [ // United Arab Emirates
      { value: 'AZ', label: 'Abu Dhabi' },
      { value: 'AJ', label: 'Ajman' },
      { value: 'DU', label: 'Dubai' },
      { value: 'FU', label: 'Fujairah' },
      { value: 'RK', label: 'Ras Al Khaimah' },
      { value: 'SH', label: 'Sharjah' },
      { value: 'UQ', label: 'Umm Al Quwain' }
    ],
    sa: [ // Saudi Arabia
      { value: 'RI', label: 'Riyadh' },
      { value: 'MK', label: 'Makkah' },
      { value: 'MD', label: 'Madinah' },
      { value: 'QA', label: 'Al-Qassim' },
      { value: 'ES', label: 'Eastern Province' },
      { value: 'AS', label: 'Asir' },
      { value: 'TB', label: 'Tabuk' },
      { value: 'HA', label: 'Hail' },
      { value: 'NB', label: 'Northern Borders' },
      { value: 'JZ', label: 'Jazan' },
      { value: 'NJ', label: 'Najran' },
      { value: 'BA', label: 'Al Bahah' },
      { value: 'JF', label: 'Al Jawf' }
    ],
    jo: [ // Jordan
      { value: 'AM', label: 'Amman' },
      { value: 'AQ', label: 'Aqaba' },
      { value: 'BA', label: 'Balqa' },
      { value: 'IR', label: 'Irbid' },
      { value: 'JA', label: 'Jerash' },
      { value: 'KA', label: 'Karak' },
      { value: 'MA', label: "Ma'an" },
      { value: 'MD', label: 'Madaba' },
      { value: 'MF', label: 'Mafraq' },
      { value: 'TA', label: 'Tafilah' },
      { value: 'AJ', label: 'Ajloun' },
      { value: 'ZA', label: 'Zarqa' }
    ],
    lb: [ // Lebanon
      { value: 'AK', label: 'Akkar' },
      { value: 'BH', label: 'Baalbek-Hermel' },
      { value: 'BA', label: 'Beirut' },
      { value: 'BQ', label: 'Beqaa' },
      { value: 'JL', label: 'Mount Lebanon' },
      { value: 'NA', label: 'Nabatieh' },
      { value: 'NL', label: 'North Lebanon' },
      { value: 'SL', label: 'South Lebanon' }
    ],
    iq: [ // Iraq
      { value: 'AN', label: 'Al Anbar' },
      { value: 'BA', label: 'Basra' },
      { value: 'MU', label: 'Muthanna' },
      { value: 'QA', label: 'Al-Qādisiyyah' },
      { value: 'NA', label: 'Najaf' },
      { value: 'BB', label: 'Babil' },
      { value: 'BG', label: 'Baghdad' },
      { value: 'DQ', label: 'Dhi Qar' },
      { value: 'DI', label: 'Diyala' },
      { value: 'AR', label: 'Erbil' },
      { value: 'KA', label: 'Karbala' },
      { value: 'KI', label: 'Kirkuk' },
      { value: 'MA', label: 'Maysan' },
      { value: 'NI', label: 'Ninawa' },
      { value: 'SD', label: 'Saladin' },
      { value: 'SU', label: 'Sulaymaniyah' },
      { value: 'DA', label: 'Dahuk' },
      { value: 'WA', label: 'Wasit' }
    ],
    ir: [ // Iran
      { value: 'TEH', label: 'Tehran' },
      { value: 'QOM', label: 'Qom' },
      { value: 'MKZ', label: 'Markazi' },
      { value: 'QAZ', label: 'Qazvin' },
      { value: 'GIL', label: 'Gilan' },
      { value: 'ARD', label: 'Ardabil' },
      { value: 'ZAN', label: 'Zanjan' },
      { value: 'EAZ', label: 'East Azerbaijan' },
      { value: 'WAZ', label: 'West Azerbaijan' },
      { value: 'KRD', label: 'Kurdistan' },
      { value: 'HDN', label: 'Hamadan' },
      { value: 'KRM', label: 'Kermanshah' },
      { value: 'ILM', label: 'Ilam' },
      { value: 'LRS', label: 'Lorestan' },
      { value: 'KHZ', label: 'Khuzestan' },
      { value: 'CMB', label: 'Chaharmahal and Bakhtiari' },
      { value: 'KBA', label: 'Kohgiluyeh and Boyer-Ahmad' },
      { value: 'BSH', label: 'Bushehr' },
      { value: 'FAR', label: 'Fars' },
      { value: 'HRZ', label: 'Hormozgan' },
      { value: 'SBL', label: 'Sistan and Baluchestan' },
      { value: 'KER', label: 'Kerman' },
      { value: 'YZD', label: 'Yazd' },
      { value: 'EFH', label: 'Isfahan' },
      { value: 'SMN', label: 'Semnan' },
      { value: 'MZD', label: 'Mazandaran' },
      { value: 'GOL', label: 'Golestan' },
      { value: 'NKH', label: 'North Khorasan' },
      { value: 'RKH', label: 'Razavi Khorasan' },
      { value: 'SKH', label: 'South Khorasan' },
      { value: 'ALB', label: 'Alborz' }
    ],
    om: [ // Oman
      { value: 'DA', label: 'Ad Dakhiliyah' },
      { value: 'BA', label: 'Al Batinah North' },
      { value: 'BS', label: 'Al Batinah South' },
      { value: 'BU', label: 'Al Buraimi' },
      { value: 'DH', label: 'Ad Dhahirah' },
      { value: 'MA', label: 'Muscat' },
      { value: 'MU', label: 'Musandam' },
      { value: 'SH', label: 'Ash Sharqiyah North' },
      { value: 'SS', label: 'Ash Sharqiyah South' },
      { value: 'WU', label: 'Al Wusta' },
      { value: 'ZA', label: 'Dhofar' }
    ],
    co: [ // Colombia
      { value: 'AMA', label: 'Amazonas' },
      { value: 'ANT', label: 'Antioquia' },
      { value: 'ARA', label: 'Arauca' },
      { value: 'ATL', label: 'Atlántico' },
      { value: 'BOL', label: 'Bolívar' },
      { value: 'BOY', label: 'Boyacá' },
      { value: 'CAL', label: 'Caldas' },
      { value: 'CAQ', label: 'Caquetá' },
      { value: 'CAS', label: 'Casanare' },
      { value: 'CAU', label: 'Cauca' },
      { value: 'CES', label: 'Cesar' },
      { value: 'CHO', label: 'Chocó' },
      { value: 'COR', label: 'Córdoba' },
      { value: 'CUN', label: 'Cundinamarca' },
      { value: 'DC', label: 'Distrito Capital de Bogotá' },
      { value: 'GUA', label: 'Guainía' },
      { value: 'GUV', label: 'Guaviare' },
      { value: 'HUI', label: 'Huila' },
      { value: 'LAG', label: 'La Guajira' },
      { value: 'MAG', label: 'Magdalena' },
      { value: 'MET', label: 'Meta' },
      { value: 'NAR', label: 'Nariño' },
      { value: 'NSA', label: 'Norte de Santander' },
      { value: 'PUT', label: 'Putumayo' },
      { value: 'QUI', label: 'Quindío' },
      { value: 'RIS', label: 'Risaralda' },
      { value: 'SAP', label: 'San Andrés y Providencia' },
      { value: 'SAN', label: 'Santander' },
      { value: 'SUC', label: 'Sucre' },
      { value: 'TOL', label: 'Tolima' },
      { value: 'VAC', label: 'Valle del Cauca' },
      { value: 'VAU', label: 'Vaupés' },
      { value: 'VID', label: 'Vichada' }
    ],
    pe: [ // Peru
      { value: 'AMA', label: 'Amazonas' },
      { value: 'ANC', label: 'Ancash' },
      { value: 'APU', label: 'Apurímac' },
      { value: 'ARE', label: 'Arequipa' },
      { value: 'AYA', label: 'Ayacucho' },
      { value: 'CAJ', label: 'Cajamarca' },
      { value: 'CAL', label: 'Callao' },
      { value: 'CUS', label: 'Cusco' },
      { value: 'HUV', label: 'Huancavelica' },
      { value: 'HUC', label: 'Huánuco' },
      { value: 'ICA', label: 'Ica' },
      { value: 'JUN', label: 'Junín' },
      { value: 'LAL', label: 'La Libertad' },
      { value: 'LAM', label: 'Lambayeque' },
      { value: 'LIM', label: 'Lima' },
      { value: 'LOR', label: 'Loreto' },
      { value: 'MDD', label: 'Madre de Dios' },
      { value: 'MOQ', label: 'Moquegua' },
      { value: 'PAS', label: 'Pasco' },
      { value: 'PIU', label: 'Piura' },
      { value: 'PUN', label: 'Puno' },
      { value: 'SAM', label: 'San Martín' },
      { value: 'TAC', label: 'Tacna' },
      { value: 'TUM', label: 'Tumbes' },
      { value: 'UCA', label: 'Ucayali' }
    ],
    cl: [ // Chile
      { value: 'AI', label: 'Aysén' },
      { value: 'AN', label: 'Antofagasta' },
      { value: 'AP', label: 'Arica y Parinacota' },
      { value: 'AT', label: 'Atacama' },
      { value: 'BI', label: 'Biobío' },
      { value: 'CO', label: 'Coquimbo' },
      { value: 'LI', label: "Libertador General Bernardo O'Higgins" },
      { value: 'LL', label: 'Los Lagos' },
      { value: 'LR', label: 'Los Ríos' },
      { value: 'MA', label: 'Magallanes' },
      { value: 'ML', label: 'Maule' },
      { value: 'NB', label: 'Ñuble' },
      { value: 'RM', label: 'Región Metropolitana de Santiago' },
      { value: 'TA', label: 'Tarapacá' },
      { value: 'VS', label: 'Valparaíso' },
      { value: 'AR', label: 'La Araucanía' }
    ],
    nl: [ // Netherlands
      { value: 'DR', label: 'Drenthe' },
      { value: 'FL', label: 'Flevoland' },
      { value: 'FR', label: 'Friesland' },
      { value: 'GE', label: 'Gelderland' },
      { value: 'GR', label: 'Groningen' },
      { value: 'LI', label: 'Limburg' },
      { value: 'NB', label: 'Noord-Brabant' },
      { value: 'NH', label: 'Noord-Holland' },
      { value: 'OV', label: 'Overijssel' },
      { value: 'UT', label: 'Utrecht' },
      { value: 'ZE', label: 'Zeeland' },
      { value: 'ZH', label: 'Zuid-Holland' }
    ],
    be: [ // Belgium
      { value: 'VAN', label: 'Antwerpen' },
      { value: 'BRU', label: 'Brussels' },
      { value: 'VOV', label: 'Oost-Vlaanderen' },
      { value: 'VBR', label: 'Vlaams-Brabant' },
      { value: 'VWV', label: 'West-Vlaanderen' },
      { value: 'WBR', label: 'Brabant Wallon' },
      { value: 'WHT', label: 'Hainaut' },
      { value: 'WLG', label: 'Liège' },
      { value: 'WLX', label: 'Luxembourg' },
      { value: 'WNA', label: 'Namur' },
      { value: 'VLI', label: 'Limburg' }
    ],
    se: [ // Sweden
      { value: 'BL', label: 'Blekinge' },
      { value: 'DA', label: 'Dalarna' },
      { value: 'GA', label: 'Gävleborg' },
      { value: 'GO', label: 'Gotland' },
      { value: 'HA', label: 'Halland' },
      { value: 'JA', label: 'Jämtland' },
      { value: 'JO', label: 'Jönköping' },
      { value: 'KA', label: 'Kalmar' },
      { value: 'KR', label: 'Kronoberg' },
      { value: 'NO', label: 'Norrbotten' },
      { value: 'OR', label: 'Örebro' },
      { value: 'OS', label: 'Östergötland' },
      { value: 'SK', label: 'Skåne' },
      { value: 'SO', label: 'Södermanland' },
      { value: 'ST', label: 'Stockholm' },
      { value: 'UP', label: 'Uppsala' },
      { value: 'VB', label: 'Västerbotten' },
      { value: 'VN', label: 'Västernorrland' },
      { value: 'VM', label: 'Västmanland' },
      { value: 'VG', label: 'Västra Götaland' },
      { value: 'VA', label: 'Värmland' }
    ],
    ch: [ // Switzerland
      { value: 'AG', label: 'Aargau' },
      { value: 'AR', label: 'Appenzell Ausserrhoden' },
      { value: 'AI', label: 'Appenzell Innerrhoden' },
      { value: 'BL', label: 'Basel-Landschaft' },
      { value: 'BS', label: 'Basel-Stadt' },
      { value: 'BE', label: 'Bern' },
      { value: 'FR', label: 'Fribourg' },
      { value: 'GE', label: 'Geneva' },
      { value: 'GL', label: 'Glarus' },
      { value: 'GR', label: 'Graubünden' },
      { value: 'JU', label: 'Jura' },
      { value: 'LU', label: 'Lucerne' },
      { value: 'NE', label: 'Neuchâtel' },
      { value: 'NW', label: 'Nidwalden' },
      { value: 'OW', label: 'Obwalden' },
      { value: 'SG', label: 'St. Gallen' },
      { value: 'SH', label: 'Schaffhausen' },
      { value: 'SZ', label: 'Schwyz' },
      { value: 'SO', label: 'Solothurn' },
      { value: 'TG', label: 'Thurgau' },
      { value: 'TI', label: 'Ticino' },
      { value: 'UR', label: 'Uri' },
      { value: 'VS', label: 'Valais' },
      { value: 'VD', label: 'Vaud' },
      { value: 'ZG', label: 'Zug' },
      { value: 'ZH', label: 'Zürich' }
    ],
    at: [ // Austria
      { value: 'B', label: 'Burgenland' },
      { value: 'K', label: 'Carinthia' },
      { value: 'NO', label: 'Lower Austria' },
      { value: 'OO', label: 'Upper Austria' },
      { value: 'S', label: 'Salzburg' },
      { value: 'ST', label: 'Styria' },
      { value: 'T', label: 'Tyrol' },
      { value: 'V', label: 'Vorarlberg' },
      { value: 'W', label: 'Vienna' }
    ],
    pl: [ // Poland
      { value: 'DS', label: 'Lower Silesian' },
      { value: 'KP', label: 'Kuyavian-Pomeranian' },
      { value: 'LU', label: 'Lublin' },
      { value: 'LB', label: 'Lubusz' },
      { value: 'LD', label: 'Łódź' },
      { value: 'MA', label: 'Lesser Poland' },
      { value: 'MZ', label: 'Masovian' },
      { value: 'OP', label: 'Opole' },
      { value: 'PK', label: 'Subcarpathian' },
      { value: 'PD', label: 'Podlaskie' },
      { value: 'PM', label: 'Pomeranian' },
      { value: 'SL', label: 'Silesian' },
      { value: 'SK', label: 'Holy Cross' },
      { value: 'WN', label: 'Warmian-Masurian' },
      { value: 'WP', label: 'Greater Poland' },
      { value: 'ZP', label: 'West Pomeranian' }
    ],
    ie: [ // Ireland
      { value: 'CW', label: 'Carlow' },
      { value: 'CN', label: 'Cavan' },
      { value: 'CE', label: 'Clare' },
      { value: 'CO', label: 'Cork' },
      { value: 'DL', label: 'Donegal' },
      { value: 'D', label: 'Dublin' },
      { value: 'G', label: 'Galway' },
      { value: 'KY', label: 'Kerry' },
      { value: 'KE', label: 'Kildare' },
      { value: 'KK', label: 'Kilkenny' },
      { value: 'LS', label: 'Laois' },
      { value: 'LM', label: 'Leitrim' },
      { value: 'LK', label: 'Limerick' },
      { value: 'LD', label: 'Longford' },
      { value: 'LH', label: 'Louth' },
      { value: 'MO', label: 'Mayo' },
      { value: 'MH', label: 'Meath' },
      { value: 'MN', label: 'Monaghan' },
      { value: 'OY', label: 'Offaly' },
      { value: 'RN', label: 'Roscommon' },
      { value: 'SO', label: 'Sligo' },
      { value: 'TA', label: 'Tipperary' },
      { value: 'WD', label: 'Waterford' },
      { value: 'WH', label: 'Westmeath' },
      { value: 'WX', label: 'Wexford' },
      { value: 'WW', label: 'Wicklow' }
    ],
    pt: [ // Portugal
      { value: 'AVE', label: 'Aveiro' },
      { value: 'BEJ', label: 'Beja' },
      { value: 'BRA', label: 'Braga' },
      { value: 'BGA', label: 'Bragança' },
      { value: 'CBR', label: 'Castelo Branco' },
      { value: 'COI', label: 'Coimbra' },
      { value: 'EVO', label: 'Évora' },
      { value: 'FAR', label: 'Faro' },
      { value: 'GUA', label: 'Guarda' },
      { value: 'LEI', label: 'Leiria' },
      { value: 'LIS', label: 'Lisboa' },
      { value: 'PTL', label: 'Portalegre' },
      { value: 'POR', label: 'Porto' },
      { value: 'STR', label: 'Santarém' },
      { value: 'SET', label: 'Setúbal' },
      { value: 'VCT', label: 'Viana do Castelo' },
      { value: 'VRL', label: 'Vila Real' },
      { value: 'VIS', label: 'Viseu' }
    ],
    no: [ // Norway
      { value: 'AGD', label: 'Agder' },
      { value: 'INN', label: 'Innlandet' },
      { value: 'MOR', label: 'Møre og Romsdal' },
      { value: 'NOR', label: 'Nordland' },
      { value: 'OSL', label: 'Oslo' },
      { value: 'ROG', label: 'Rogaland' },
      { value: 'TRO', label: 'Troms og Finnmark' },
      { value: 'TRO', label: 'Trøndelag' },
      { value: 'VES', label: 'Vestfold og Telemark' },
      { value: 'VIK', label: 'Vestland' },
      { value: 'VIK', label: 'Viken' }
    ],
    dk: [ // Denmark
      { value: 'CPH', label: 'Capital Region' },
      { value: 'CEN', label: 'Central Denmark' },
      { value: 'NOR', label: 'North Denmark' },
      { value: 'ZEA', label: 'Zealand' },
      { value: 'SOU', label: 'Southern Denmark' }
    ],
    fi: [ // Finland
      { value: 'UUS', label: 'Uusimaa' },
      { value: 'VAR', label: 'Southwest Finland' },
      { value: 'SAT', label: 'Satakunta' },
      { value: 'KAN', label: 'Tavastia Proper' },
      { value: 'PIR', label: 'Pirkanmaa' },
      { value: 'PAI', label: 'Päijänne Tavastia' },
      { value: 'KYM', label: 'Kymenlaakso' },
      { value: 'EKA', label: 'South Karelia' },
      { value: 'ESA', label: 'Southern Savonia' },
      { value: 'PSA', label: 'Northern Savonia' },
      { value: 'PKA', label: 'North Karelia' },
      { value: 'KES', label: 'Central Finland' },
      { value: 'EPO', label: 'Southern Ostrobothnia' },
      { value: 'POH', label: 'Ostrobothnia' },
      { value: 'KPO', label: 'Central Ostrobothnia' },
      { value: 'PPO', label: 'Northern Ostrobothnia' },
      { value: 'KAI', label: 'Kainuu' },
      { value: 'LAP', label: 'Lapland' },
      { value: 'AHV', label: 'Åland Islands' }
    ],
    th: [ // Thailand
      { value: 'BKK', label: 'Bangkok' },
      { value: 'KRI', label: 'Kanchanaburi' },
      { value: 'CNT', label: 'Chanthaburi' },
      { value: 'CRI', label: 'Chiang Rai' },
      { value: 'CMA', label: 'Chiang Mai' },
      { value: 'NWT', label: 'Nonthaburi' },
      { value: 'PTN', label: 'Pathum Thani' },
      { value: 'AYA', label: 'Phra Nakhon Si Ayutthaya' },
      { value: 'PKT', label: 'Phuket' },
      { value: 'SKA', label: 'Songkhla' },
      { value: 'STN', label: 'Satun' },
      { value: 'NKI', label: 'Nakhon Si Thammarat' },
      { value: 'NRT', label: 'Nakhon Ratchasima' },
      { value: 'CMI', label: 'Chai Nat' },
      { value: 'UTD', label: 'Udon Thani' },
      { value: 'UBN', label: 'Ubon Ratchathani' },
      { value: 'TAK', label: 'Tak' },
      { value: 'KKN', label: 'Khon Kaen' },
      { value: 'RNG', label: 'Ranong' },
      { value: 'RYG', label: 'Rayong' }
    ],
    vn: [ // Vietnam
      { value: 'HN', label: 'Hanoi' },
      { value: 'SG', label: 'Ho Chi Minh City' },
      { value: 'DN', label: 'Da Nang' },
      { value: 'HP', label: 'Hai Phong' },
      { value: 'CT', label: 'Can Tho' },
      { value: 'AG', label: 'An Giang' },
      { value: 'VT', label: 'Ba Ria-Vung Tau' },
      { value: 'BG', label: 'Bac Giang' },
      { value: 'BK', label: 'Bac Kan' },
      { value: 'BL', label: 'Bac Lieu' },
      { value: 'BN', label: 'Bac Ninh' },
      { value: 'BD', label: 'Binh Dinh' },
      { value: 'BU', label: 'Binh Duong' },
      { value: 'BP', label: 'Binh Phuoc' },
      { value: 'BT', label: 'Binh Thuan' },
      { value: 'CM', label: 'Ca Mau' },
      { value: 'DL', label: 'Dak Lak' },
      { value: 'DB', label: 'Dien Bien' },
      { value: 'GL', label: 'Gia Lai' },
      { value: 'HG', label: 'Ha Giang' },
      { value: 'HD', label: 'Hai Duong' },
      { value: 'HM', label: 'Ha Nam' },
      { value: 'HT', label: 'Ha Tinh' },
      { value: 'KH', label: 'Khanh Hoa' },
      { value: 'KG', label: 'Kien Giang' },
      { value: 'LA', label: 'Lai Chau' },
      { value: 'LD', label: 'Lam Dong' },
      { value: 'LS', label: 'Lang Son' },
      { value: 'LO', label: 'Lao Cai' },
      { value: 'NB', label: 'Ninh Binh' },
      { value: 'NT', label: 'Ninh Thuan' },
      { value: 'PT', label: 'Phu Tho' },
      { value: 'QB', label: 'Quang Binh' },
      { value: 'QN', label: 'Quang Nam' },
      { value: 'QG', label: 'Quang Ngai' },
      { value: 'QN', label: 'Quang Ninh' }
    ],
    ph: [ // Philippines
      { value: 'NCR', label: 'National Capital Region' },
      { value: 'CAR', label: 'Cordillera Administrative Region' },
      { value: 'R1', label: 'Ilocos Region' },
      { value: 'R2', label: 'Cagayan Valley' },
      { value: 'R3', label: 'Central Luzon' },
      { value: 'R4A', label: 'CALABARZON' },
      { value: 'R4B', label: 'MIMAROPA' },
      { value: 'R5', label: 'Bicol Region' },
      { value: 'R6', label: 'Western Visayas' },
      { value: 'R7', label: 'Central Visayas' },
      { value: 'R8', label: 'Eastern Visayas' },
      { value: 'R9', label: 'Zamboanga Peninsula' },
      { value: 'R10', label: 'Northern Mindanao' },
      { value: 'R11', label: 'Davao Region' },
      { value: 'R12', label: 'SOCCSKSARGEN' },
      { value: 'R13', label: 'Caraga' },
      { value: 'BARMM', label: 'Bangsamoro' }
    ],
    my: [ // Malaysia
      { value: 'JHR', label: 'Johor' },
      { value: 'KDH', label: 'Kedah' },
      { value: 'KTN', label: 'Kelantan' },
      { value: 'MLK', label: 'Malacca' },
      { value: 'NSN', label: 'Negeri Sembilan' },
      { value: 'PHG', label: 'Pahang' },
      { value: 'PRK', label: 'Perak' },
      { value: 'PLS', label: 'Perlis' },
      { value: 'PNG', label: 'Penang' },
      { value: 'SBH', label: 'Sabah' },
      { value: 'SWK', label: 'Sarawak' },
      { value: 'SGR', label: 'Selangor' },
      { value: 'TRG', label: 'Terengganu' },
      { value: 'KUL', label: 'Kuala Lumpur' },
      { value: 'LBN', label: 'Labuan' },
      { value: 'PJY', label: 'Putrajaya' }
    ],
    sg: [ // Singapore
      { value: 'CS', label: 'Central Singapore' },
      { value: 'NE', label: 'North East' },
      { value: 'NW', label: 'North West' },
      { value: 'SE', label: 'South East' },
      { value: 'SW', label: 'South West' }
    ],
    id: [ // Indonesia
      { value: 'AC', label: 'Aceh' },
      { value: 'BA', label: 'Bali' },
      { value: 'BB', label: 'Bangka Belitung Islands' },
      { value: 'BT', label: 'Banten' },
      { value: 'BE', label: 'Bengkulu' },
      { value: 'GO', label: 'Gorontalo' },
      { value: 'JK', label: 'Jakarta' },
      { value: 'JA', label: 'Jambi' },
      { value: 'JB', label: 'West Java' },
      { value: 'JT', label: 'Central Java' },
      { value: 'JI', label: 'East Java' },
      { value: 'KB', label: 'West Kalimantan' },
      { value: 'KS', label: 'South Kalimantan' },
      { value: 'KT', label: 'Central Kalimantan' },
      { value: 'KI', label: 'East Kalimantan' },
      { value: 'KU', label: 'North Kalimantan' },
      { value: 'KR', label: 'Riau Islands' },
      { value: 'LA', label: 'Lampung' },
      { value: 'MA', label: 'Maluku' },
      { value: 'MU', label: 'North Maluku' },
      { value: 'NB', label: 'West Nusa Tenggara' },
      { value: 'NT', label: 'East Nusa Tenggara' },
      { value: 'PA', label: 'Papua' },
      { value: 'PB', label: 'West Papua' },
      { value: 'RI', label: 'Riau' },
      { value: 'SR', label: 'West Sulawesi' },
      { value: 'SN', label: 'South Sulawesi' },
      { value: 'ST', label: 'Central Sulawesi' },
      { value: 'SG', label: 'Southeast Sulawesi' },
      { value: 'SA', label: 'North Sulawesi' },
      { value: 'SB', label: 'West Sumatra' },
      { value: 'SS', label: 'South Sumatra' },
      { value: 'SU', label: 'North Sumatra' },
      { value: 'YO', label: 'Special Region of Yogyakarta' }
    ],
    nz: [ // New Zealand
      { value: 'AUK', label: 'Auckland' },
      { value: 'BOP', label: 'Bay of Plenty' },
      { value: 'CAN', label: 'Canterbury' },
      { value: 'GIS', label: 'Gisborne' },
      { value: 'HKB', label: "Hawke's Bay" },
      { value: 'MWT', label: 'Manawatu-Whanganui' },
      { value: 'MBH', label: 'Marlborough' },
      { value: 'NSN', label: 'Nelson' },
      { value: 'NTL', label: 'Northland' },
      { value: 'OTA', label: 'Otago' },
      { value: 'STL', label: 'Southland' },
      { value: 'TKI', label: 'Taranaki' },
      { value: 'TAS', label: 'Tasman' },
      { value: 'WKO', label: 'Waikato' },
      { value: 'WGN', label: 'Wellington' },
      { value: 'WTC', label: 'West Coast' },
      { value: 'CIT', label: 'Chatham Islands Territory' }
    ],
    pg: [ // Papua New Guinea
      { value: 'CPK', label: 'Chimbu' },
      { value: 'CPM', label: 'Central' },
      { value: 'EBR', label: 'East New Britain' },
      { value: 'EHG', label: 'Eastern Highlands' },
      { value: 'EPW', label: 'Enga' },
      { value: 'ESW', label: 'East Sepik' },
      { value: 'GPK', label: 'Gulf' },
      { value: 'MBA', label: 'Milne Bay' },
      { value: 'MPL', label: 'Morobe' },
      { value: 'MPM', label: 'Madang' },
      { value: 'MRL', label: 'Manus' },
      { value: 'NCD', label: 'National Capital District' },
      { value: 'NIK', label: 'New Ireland' },
      { value: 'NPP', label: 'Northern' },
      { value: 'NSB', label: 'Bougainville' },
      { value: 'SAN', label: 'West Sepik' },
      { value: 'SHM', label: 'Southern Highlands' },
      { value: 'WBK', label: 'West New Britain' },
      { value: 'WHM', label: 'Western Highlands' },
      { value: 'WPD', label: 'Western' }
    ],
    fj: [ // Fiji
      { value: 'C', label: 'Central Division' },
      { value: 'E', label: 'Eastern Division' },
      { value: 'N', label: 'Northern Division' },
      { value: 'W', label: 'Western Division' },
      { value: 'R', label: 'Rotuma' }
    ],
    sb: [ // Solomon Islands
      { value: 'CE', label: 'Central' },
      { value: 'CH', label: 'Choiseul' },
      { value: 'GC', label: 'Guadalcanal' },
      { value: 'IS', label: 'Isabel' },
      { value: 'MK', label: 'Makira-Ulawa' },
      { value: 'ML', label: 'Malaita' },
      { value: 'RB', label: 'Rennell and Bellona' },
      { value: 'TE', label: 'Temotu' },
      { value: 'WE', label: 'Western' }
    ],
    vu: [ // Vanuatu
      { value: 'MAP', label: 'Malampa' },
      { value: 'PAM', label: 'Penama' },
      { value: 'SAM', label: 'Sanma' },
      { value: 'SEE', label: 'Shefa' },
      { value: 'TAE', label: 'Tafea' },
      { value: 'TOB', label: 'Torba' }
    ],
    nc: [ // New Caledonia
      { value: 'IL', label: 'Loyalty Islands' },
      { value: 'NC', label: 'North Province' },
      { value: 'SC', label: 'South Province' }
    ],
    ws: [ // Samoa
      { value: 'AA', label: "A'ana" },
      { value: 'AL', label: 'Aiga-i-le-Tai' },
      { value: 'AT', label: 'Atua' },
      { value: 'FA', label: "Fa'asaleleaga" },
      { value: 'GE', label: "Gaga'emauga" },
      { value: 'GI', label: 'Gagaifomauga' },
      { value: 'PA', label: 'Palauli' },
      { value: 'SA', label: "Satupa'itea" },
      { value: 'TU', label: 'Tuamasaga' },
      { value: 'VF', label: "Va'a-o-Fonoti" },
      { value: 'VS', label: 'Vaisigano' }
    ],
    to: [ // Tonga
      { value: 'EU', label: "Eua" },
      { value: 'HA', label: "Ha'apai" },
      { value: 'NI', label: 'Niuas' },
      { value: 'TT', label: 'Tongatapu' },
      { value: 'VA', label: "Vava'u" }
    ],
    // ... existing code ...
  };

  // Handle country change
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setCountry(selectedCountry);
    setState(''); // Reset state when country changes
  };

  // Handle file selection for cover image
  const handleCoverImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Create a preview URL
      const objectUrl = URL.createObjectURL(file);
      setCoverImageUrl(objectUrl);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Convert file to base64 string (fallback if storage fails)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload cover image to Supabase Storage
  const uploadCoverImage = async () => {
    if (!coverImage) return null;
    
    setUploadingCover(true);
    try {
      console.log('Starting cover image upload...', coverImage);
      
      // Get user from localStorage instead of session
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please sign in again.');
      }
      
      const user = JSON.parse(userStr);
      console.log('User found for upload:', user.id);
      
      // Create a unique file name with user ID
      const fileExt = coverImage.name.split('.').pop();
      const fileName = `${user.id}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Upload directly to root of bucket
      
      console.log('Uploading to path:', filePath);
      
      // Try base64 storage directly
      try {
        console.log('Converting to base64 for reliable storage...');
        const base64String = await fileToBase64(coverImage);
        return base64String;
      } catch (base64Error) {
        console.error('Error converting to base64:', base64Error.message);
        throw base64Error;
      }
    } catch (error) {
      console.error('Error uploading cover image:', error.message);
      setError('Failed to upload cover image. Please try again.');
      return null;
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle file selection for album images
  const handleAlbumImagesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Limit to 3 images max
      const newFiles = files.slice(0, 3 - albumImages.length);
      
      // Create preview URLs
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      
      // Update state
      setAlbumImages(prev => [...prev, ...newFiles].slice(0, 3));
      setAlbumImageUrls(prev => [...prev, ...newUrls].slice(0, 3));
    }
  };

  // Trigger album file input click
  const handleAlbumUploadClick = () => {
    albumInputRef.current.click();
  };

  // Remove an album image
  const handleRemoveAlbumImage = (index) => {
    setAlbumImages(prev => {
      const newImages = [...prev];
      newImages.splice(index, 1);
      return newImages;
    });
    
    setAlbumImageUrls(prev => {
      const newUrls = [...prev];
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  // Upload album images to Supabase Storage
  const uploadAlbumImages = async () => {
    if (albumImages.length === 0) return [];
    
    setUploadingAlbum(true);
    const uploadedUrls = [];
    
    try {
      console.log('Starting album images upload...', albumImages.length, 'images');
      
      // Get user from localStorage instead of session
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please sign in again.');
      }
      
      const user = JSON.parse(userStr);
      console.log('User found for album upload:', user.id);
      
      for (const image of albumImages) {
        try {
          console.log('Processing album image:', image.name);
          
          // Convert directly to base64 for reliable storage
          console.log('Converting album image to base64...');
            const base64String = await fileToBase64(image);
            uploadedUrls.push(base64String);
        } catch (imageError) {
          console.error('Error uploading album image:', imageError.message);
          // Continue with other images
        }
      }
      
      console.log('Completed album uploads, total successful:', uploadedUrls.length);
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading album images:', error.message);
      setError('Failed to upload album images. Please try again.');
      return uploadedUrls; // Return any successfully uploaded images
    } finally {
      setUploadingAlbum(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any existing errors
    
    // Validate required fields
    if (!eventName.trim()) {
      setError('Event name is required.');
      return;
    }
    
    if (!eventDate) {
      setError('Event date is required.');
      return;
    }
    
    if (!startTime) {
      setError('Start time is required.');
      return;
    }
    
    if (!endTime) {
      setError('End time is required.');
      return;
    }
    
    // Validate that end time is after start time
    if (startTime && endTime && startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }
    
    setIsLoading(true);
    try {
      // Store promotion status in session storage before navigating
      sessionStorage.setItem('isPromotionEnabled', isPromotionEnabled);
      
      // Get user from localStorage (custom users table)
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('User not found. Please log in again.');
      }
      
      const user = JSON.parse(userStr);
      
      // Prepare event data
      const eventData = {
        user_id: user.id,
        name: eventName,
        description: description,
        category: category === 'other' ? customCategory : category,
        address: address,
        city: city,
        state: state,
        country: country,
        location_coordinates: location ? `(${location.lng},${location.lat})` : null,
        event_date: eventDate,
        start_time: startTime || null,
        end_time: endTime || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        is_public: isPublic,
        is_paid: isPaid,
        is_promotion_enabled: isPromotionEnabled,
        is_online: isOnline,
        event_link: eventLink || '',
        event_type: isOnline ? 'online' : 'physical',
        online_event_link: isOnline ? (eventLink || '') : '',
        status: 'draft',
        // Add early bird discount data
        has_early_bird: hasEarlyBird,
        early_bird_start_date: hasEarlyBird ? earlyBirdStartDate : null,
        early_bird_end_date: hasEarlyBird ? earlyBirdEndDate : null,
        early_bird_discount: hasEarlyBird ? parseInt(earlyBirdDiscount) || 0 : null,
        // Add multiple buys discount data
        has_multiple_buys: hasMultipleBuys,
        multiple_buys_min_tickets: hasMultipleBuys ? parseInt(multipleBuysMinTickets) || 2 : null,
        multiple_buys_discount: hasMultipleBuys ? parseInt(multipleBuysDiscount) || 0 : null,
        ticket_price: isPaid ? Number(price) : 0,
        ticket_quantity: Number(quantity) || 0
      };
      
      console.log('Saving event data to Supabase...', eventData);
      
      // Insert event into events table with RLS bypass
      const { data: eventResult, error: eventError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError.message);
        
        // Handle specific error types with user-friendly messages
        if (eventError.message.includes("invalid input syntax for type time")) {
          throw new Error('Please ensure time fields are in the correct format (HH:MM).');
        } else if (eventError.message.includes("invalid input syntax for type date")) {
          throw new Error('Please ensure date fields are in the correct format (YYYY-MM-DD).');
        } else {
          throw new Error('Failed to create event. Please check all fields and try again.');
        }
      }

      if (!eventResult) {
        throw new Error('No event data returned after creation');
      }

      console.log('Event created successfully:', eventResult);

      // Create a standard ticket tier for paid events
      if (isPaid && eventResult.id) {
        try {
          const ticketTierData = {
            event_id: eventResult.id,
            name: ticketTitle || 'Standard Ticket',
            description: 'Standard entry ticket',
            price: parseFloat(price) || 0,
            quantity: parseInt(quantity) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Creating standard ticket tier:', ticketTierData);
          
          const { error: ticketError } = await supabase
            .from('ticket_tiers')
            .insert([ticketTierData]);
            
          if (ticketError) {
            console.error('Error creating standard ticket tier:', ticketError.message);
            // Continue with event creation even if ticket tier creation fails
          } else {
            console.log('Standard ticket tier created successfully');
          }
          
          // If premium ticket tiers are enabled, create those as well
          if (hasTicketTiers && ticketTiers.length > 0) {
            try {
              // Prepare premium ticket tier data for bulk insert
              const premiumTiersData = ticketTiers.map(tier => ({
                event_id: eventResult.id,
                name: tier.title || '', // Use user-entered title instead of hardcoded value
                description: tier.description || '', // Use user-entered description instead of hardcoded value
                price: 0, // Standard price remains 0 for premium tiers
                quantity: 0, // Standard quantity remains 0 for premium tiers
                // Premium tier specific fields
                is_premium: true, // Add this flag to identify premium tiers
                tier_title: tier.title || 'Premium Tier',
                description: tier.description || 'Premium entry ticket',
                price: parseFloat(tier.price) || 0,
                quantity: parseInt(tier.quantity) || 0,
                tier_available_tickets: parseInt(tier.quantity) || 0, // Initially available = total quantity
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }));
              
              console.log('Creating premium ticket tiers:', premiumTiersData);
              
              // Insert all premium ticket tiers in one operation
              const { error: premiumTiersError } = await supabase
                .from('ticket_tiers')
                .insert(premiumTiersData);
                
              if (premiumTiersError) {
                console.error('Error creating premium ticket tiers:', premiumTiersError.message);
                // Continue with event creation even if premium ticket tier creation fails
              } else {
                console.log('Premium ticket tiers created successfully');
              }
            } catch (premiumTiersError) {
              console.error('Error creating premium ticket tiers:', premiumTiersError.message);
              // Continue with event creation even if premium ticket tier creation fails
            }
          }
        } catch (ticketError) {
          console.error('Error creating ticket tier:', ticketError.message);
          // Continue with event creation even if ticket tier creation fails
        }
      } 
        // If it's a free event but has quantity, create a free ticket tier
      else if (eventResult.id && quantity) {
        try {
          const freeTicketTierData = {
            event_id: eventResult.id,
            name: ticketTitle || 'Free Ticket',
            description: 'Free entry ticket',
            price: 0,
            quantity: parseInt(quantity) || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Creating free ticket tier:', freeTicketTierData);
          
          const { error: ticketError } = await supabase
            .from('ticket_tiers')
            .insert([freeTicketTierData]);
            
          if (ticketError) {
            console.error('Error creating free ticket tier:', ticketError.message);
          } else {
            console.log('Free ticket tier created successfully');
          }
        } catch (ticketError) {
          console.error('Error creating free ticket tier:', ticketError.message);
        }
      }
        
        // Process images in parallel
        const imagePromises = [];
        
        // Process cover image if selected
        if (coverImage) {
          const coverImagePromise = (async () => {
            try {
              console.log('Attempting to upload cover image...', coverImage.name);
              const coverImageUrl = await uploadCoverImage();
            console.log('Cover image upload result:', coverImageUrl ? 'Base64 data received (length: ' + coverImageUrl.length + ')' : 'Failed');
              
              if (coverImageUrl) {
              console.log('Saving cover image to event_images table...');
                const imageData = {
                event_id: eventResult.id,
                  image_url: coverImageUrl,
                  is_cover: true,
                created_at: new Date().toISOString()
                };
                
              console.log('Image data to insert:', { ...imageData, image_url: 'Base64 data (truncated)' });
                
              // Insert image with RLS bypass
              const { error: imageError } = await supabase
                  .from('event_images')
                  .insert([imageData]);
                  
                if (imageError) {
                  console.error('Error saving image data:', imageError.message);
                } else {
                  console.log('Cover image saved successfully to database');
                }
              }
            } catch (imageError) {
              console.error('Error processing cover image:', imageError.message);
              // Continue with event creation even if image upload fails
            }
          })();
          
          imagePromises.push(coverImagePromise);
        }
        
        // Process album images if any
        if (albumImages.length > 0) {
          const albumImagesPromise = (async () => {
            try {
              console.log('Uploading album images...', albumImages.length, 'images');
            const albumUrls = await uploadAlbumImages();
              
              if (albumUrls.length > 0) {
              console.log('Saving album images to event_images table...', albumUrls.length, 'base64 URLs');
                const albumData = albumUrls.map(url => ({
                event_id: eventResult.id,
                  image_url: url,
                  is_cover: false,
                created_at: new Date().toISOString()
                }));
                
              console.log('Album data to insert:', albumUrls.length, 'images as base64');
                
              // Insert album images with RLS bypass
              const { error: albumError } = await supabase
                  .from('event_images')
                  .insert(albumData);
                  
                if (albumError) {
                  console.error('Error saving album data:', albumError.message);
                } else {
                  console.log('Album images saved successfully to database');
                }
              }
            } catch (albumError) {
              console.error('Error with album images:', albumError.message);
            }
          })();
          
          imagePromises.push(albumImagesPromise);
        }
        
        // Wait for all image processing to complete (or fail)
        try {
          await Promise.allSettled(imagePromises);
          console.log('All image processing completed');
        } catch (imageProcessingError) {
          console.error('Error during image processing:', imageProcessingError.message);
          // Continue with redirection even if image processing fails
        }
        
      // Store the event ID in session storage for the review page
      sessionStorage.setItem('currentEventId', eventResult.id);
      
      // Navigate to review page
        router.push('/review-event');
    } catch (error) {
      console.error('Error creating event:', error.message);
      setError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add state to track active section
  const [activeSection, setActiveSection] = useState('upload-cover');
  
  // Function to handle section navigation
  const navigateToSection = (section) => {
    setActiveSection(section);
    
    // Scroll to the section
    const sectionElement = document.getElementById(section);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLocationSelect = (coords) => {
    setLocation(coords);
    // You can use these coordinates in your form submission
    console.log('Selected coordinates:', coords);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-slate-800">Create an event</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Public/Private Selection - Moved to top */}
        <div className="mb-8 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Event Visibility</h2>
          <div className="flex space-x-8">
            <div className="flex items-center">
              <input
                type="radio"
                id="public"
                name="visibility"
                checked={isPublic}
                onChange={() => setIsPublic(true)}
                className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
              />
              <label htmlFor="public" className="ml-2 text-sm font-medium text-slate-700">
                Public
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="private"
                name="visibility"
                checked={!isPublic}
                onChange={() => {
                  router.push('/private-event');
                }}
                className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
              />
              <label htmlFor="private" className="ml-2 text-sm font-medium text-slate-700">
                Private
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Last update</div>
              <div className="font-medium text-slate-800">Monday, June 06 | 06:42 AM</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="text-sm text-slate-500">Status</div>
              <div className="font-medium text-slate-800">Draft</div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">EVENT INFORMATION</h3>
              <ul className="space-y-2">
                <li 
                  className={`${activeSection === 'upload-cover' ? 'text-indigo-600 font-medium' : 'text-slate-600'} cursor-pointer hover:text-indigo-600 transition-colors`}
                  onClick={() => navigateToSection('upload-cover')}
                >
                  Upload cover
                </li>
                <li 
                  className={`${activeSection === 'general-information' ? 'text-indigo-600 font-medium' : 'text-slate-600'} cursor-pointer hover:text-indigo-600 transition-colors`}
                  onClick={() => navigateToSection('general-information')}
                >
                  General information
                </li>
                <li 
                  className={`${activeSection === 'location-and-time' ? 'text-indigo-600 font-medium' : 'text-slate-600'} cursor-pointer hover:text-indigo-600 transition-colors`}
                  onClick={() => navigateToSection('location-and-time')}
                >
                  Location and time
                </li>
                <li 
                  className={`${activeSection === 'ticket' ? 'text-indigo-600 font-medium' : 'text-slate-600'} cursor-pointer hover:text-indigo-600 transition-colors`}
                  onClick={() => navigateToSection('ticket')}
                >
                  Ticket
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <h3 className="font-semibold uppercase text-sm text-slate-500 mb-4">PUBLISH EVENT</h3>
              <ul className="space-y-2">
                <li 
                  className="text-slate-600 cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => router.push('/review-event')}
                >
                  Review and Publish
                </li>
              </ul>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Upload Cover Section */}
              <div id="upload-cover" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-medium text-slate-800">Upload cover</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Upload the event cover to capture your audience&apos;s attention</p>
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleCoverImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Cover image preview or upload button */}
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl h-40 flex items-center justify-center overflow-hidden relative"
                  onClick={handleUploadClick}
                >
                  {coverImageUrl ? (
                    <>
                      <Image 
                        src={coverImageUrl} 
                        alt="Cover preview" 
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <button 
                          type="button" 
                          className="text-white font-medium bg-gradient-to-r from-indigo-600 to-blue-500 px-3 py-1 rounded-lg shadow-sm hover:from-indigo-700 hover:to-blue-600 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                        >
                          Change Image
                        </button>
                      </div>
                    </>
                  ) : uploadingCover ? (
                    <div className="text-indigo-600 font-medium flex items-center">
                      <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </div>
                  ) : (
                    <button type="button" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Upload Image</button>
                  )}
                </div>
                
                {/* Image upload instructions */}
                <div className="mt-2 text-xs text-slate-500">
                  Click to upload. Recommended size: 1200 x 630 pixels. Max size: 5MB.
                </div>
              </div>
              
              {/* General Information Section */}
              <div id="general-information" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 text-xl">ℹ️</span>
                    <h2 className="text-lg font-medium text-slate-800">General information</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Make it catchy and memorable</p>
                    <input
                      type="text"
                      id="eventName"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Rock Revolt: A Fusion of Power and Passion"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Provide essential event details</p>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description..."
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Choose a category for your event</p>
                    <div className="relative">
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option value="">Select a category</option>
                        <option value="music">Music</option>
                        <option value="sports">Sports</option>
                        <option value="arts">Arts & Culture</option>
                        <option value="food">Food & Drink</option>
                        <option value="business">Business</option>
                        <option value="training">Training</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Show custom category input when "other" is selected */}
                    {category === 'other' && (
                      <div className="mt-3">
                        <label htmlFor="customCategory" className="block text-sm font-medium text-slate-700 mb-1">
                          Specify Category
                        </label>
                        <input
                          type="text"
                          id="customCategory"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Enter your category"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required={category === 'other'}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="album" className="block text-sm font-medium text-slate-700 mb-1">
                      Album
                    </label>
                    <p className="text-xs text-slate-500 mb-1">Upload images for your event (max 3)</p>
                    
                    {/* Hidden file input for album images */}
                    <input 
                      type="file" 
                      ref={albumInputRef}
                      onChange={handleAlbumImagesSelect}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    
                    <div className="flex gap-4 mt-2 flex-wrap">
                      {/* Album image previews */}
                      {albumImageUrls.map((url, index) => (
                        <div key={index} className="w-16 h-16 bg-slate-200 rounded-md relative overflow-hidden">
                          <Image 
                            src={url} 
                            alt={`Album image ${index + 1}`} 
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAlbumImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      
                      {/* Loading spinner for uploading */}
                      {uploadingAlbum && (
                        <div className="w-16 h-16 bg-slate-200 rounded-md relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                      )}
                      
                      {/* Add more button */}
                      {albumImages.length < 3 && !uploadingAlbum && (
                        <div 
                          className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center cursor-pointer hover:border-indigo-300"
                          onClick={handleAlbumUploadClick}
                        >
                          <button type="button" className="text-slate-400 hover:text-indigo-500">
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Click to upload. Max 3 images. Recommended size: 800 x 600 pixels. Max size: 5MB each.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Location and Time Section */}
              <div id="location-and-time" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 text-xl">📍</span>
                    <h2 className="text-lg font-medium text-slate-800">Location and time</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Location */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Location</h3>
                    <p className="text-xs text-slate-500 mb-4">You can choose the location or pinpoint it on the map</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Address"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1">
                            State / Province
                          </label>
                          <div className="relative">
                            <select
                              id="state"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                              disabled={!country || !statesByCountry[country]}
                            >
                              <option value="">Select state/province</option>
                              {country && statesByCountry[country]?.map(state => (
                                <option key={state.value} value={state.value}>
                                  {state.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">
                          Country / Region
                        </label>
                        <div className="relative">
                          <select
                            id="country"
                            value={country}
                            onChange={handleCountryChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                          >
                            <option value="">Select country</option>
                            {/* Africa */}
                            <optgroup label="Africa">
                              <option value="ng">Nigeria</option>
                              <option value="za">South Africa</option>
                              <option value="eg">Egypt</option>
                              <option value="ke">Kenya</option>
                              <option value="gh">Ghana</option>
                              <option value="et">Ethiopia</option>
                              <option value="tz">Tanzania</option>
                              <option value="ug">Uganda</option>
                              <option value="ci">Côte d'Ivoire</option>
                              <option value="cm">Cameroon</option>
                              <option value="sn">Senegal</option>
                              <option value="rw">Rwanda</option>
                              <option value="mg">Madagascar</option>
                              <option value="mu">Mauritius</option>
                              <option value="na">Namibia</option>
                              <option value="bw">Botswana</option>
                              <option value="zm">Zambia</option>
                              <option value="zw">Zimbabwe</option>
                            </optgroup>
                            {/* Americas */}
                            <optgroup label="North America">
                            <option value="us">United States</option>
                            <option value="ca">Canada</option>
                              <option value="mx">Mexico</option>
                            </optgroup>
                            <optgroup label="South America">
                              <option value="br">Brazil</option>
                              <option value="ar">Argentina</option>
                              <option value="co">Colombia</option>
                              <option value="pe">Peru</option>
                              <option value="cl">Chile</option>
                            </optgroup>
                            {/* Europe */}
                            <optgroup label="Europe">
                              <option value="gb">United Kingdom</option>
                              <option value="fr">France</option>
                              <option value="de">Germany</option>
                              <option value="it">Italy</option>
                              <option value="es">Spain</option>
                              <option value="nl">Netherlands</option>
                              <option value="be">Belgium</option>
                              <option value="se">Sweden</option>
                              <option value="ch">Switzerland</option>
                              <option value="at">Austria</option>
                              <option value="pl">Poland</option>
                              <option value="ie">Ireland</option>
                              <option value="pt">Portugal</option>
                              <option value="no">Norway</option>
                              <option value="dk">Denmark</option>
                              <option value="fi">Finland</option>
                            </optgroup>
                            {/* Asia */}
                            <optgroup label="Asia">
                              <option value="jp">Japan</option>
                              <option value="in">India</option>
                              <option value="cn">China</option>
                              <option value="kr">South Korea</option>
                              <option value="sg">Singapore</option>
                              <option value="my">Malaysia</option>
                              <option value="th">Thailand</option>
                              <option value="vn">Vietnam</option>
                              <option value="ph">Philippines</option>
                              <option value="id">Indonesia</option>
                            </optgroup>
                            {/* Middle East */}
                            <optgroup label="Middle East">
                              <option value="ae">United Arab Emirates</option>
                              <option value="sa">Saudi Arabia</option>
                              <option value="qa">Qatar</option>
                              <option value="kw">Kuwait</option>
                              <option value="bh">Bahrain</option>
                              <option value="om">Oman</option>
                            </optgroup>
                            {/* Oceania */}
                            <optgroup label="Oceania">
                            <option value="au">Australia</option>
                              <option value="nz">New Zealand</option>
                              <option value="fj">Fiji</option>
                            </optgroup>
                            {/* Caribbean */}
                            <optgroup label="Caribbean">
                              <option value="jm">Jamaica</option>
                              <option value="bs">Bahamas</option>
                              <option value="bb">Barbados</option>
                              <option value="tt">Trinidad and Tobago</option>
                            </optgroup>
                            {/* Central America */}
                            <optgroup label="Central America">
                              <option value="pa">Panama</option>
                              <option value="cr">Costa Rica</option>
                              <option value="gt">Guatemala</option>
                              <option value="sv">El Salvador</option>
                              <option value="hn">Honduras</option>
                              <option value="ni">Nicaragua</option>
                              <option value="bz">Belize</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map */}
                    <div className="mt-4">
                      <GoogleMapComponent onLocationSelect={handleLocationSelect} initialLocation={location} />
                    </div>
                  </div>
                  
                  {/* Time */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Time</h3>
                    <p className="text-xs text-slate-500 mb-4">Choose the start and end time for your event</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="timeZone" className="block text-sm font-medium text-slate-700 mb-1">
                          Time Zone
                        </label>
                        <div className="relative">
                          <select
                            id="timeZone"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                          >
                            {/* North America */}
                            <optgroup label="North America">
                              <option value="America/Los_Angeles">PDT (GMT-0700) United States (Los Angeles)</option>
                              <option value="America/Denver">MDT (GMT-0600) United States (Denver)</option>
                              <option value="America/Chicago">CDT (GMT-0500) United States (Chicago)</option>
                              <option value="America/New_York">EDT (GMT-0400) United States (New York)</option>
                              <option value="America/Anchorage">AKDT (GMT-0800) United States (Anchorage)</option>
                              <option value="Pacific/Honolulu">HST (GMT-1000) United States (Honolulu)</option>
                              <option value="America/Toronto">EDT (GMT-0400) Canada (Toronto)</option>
                              <option value="America/Vancouver">PDT (GMT-0700) Canada (Vancouver)</option>
                              <option value="America/Mexico_City">CDT (GMT-0500) Mexico (Mexico City)</option>
                            </optgroup>

                            {/* South America */}
                            <optgroup label="South America">
                              <option value="America/Sao_Paulo">BRT (GMT-0300) Brazil (São Paulo)</option>
                              <option value="America/Buenos_Aires">ART (GMT-0300) Argentina (Buenos Aires)</option>
                              <option value="America/Bogota">COT (GMT-0500) Colombia (Bogota)</option>
                              <option value="America/Lima">PET (GMT-0500) Peru (Lima)</option>
                              <option value="America/Santiago">CLT (GMT-0400) Chile (Santiago)</option>
                            </optgroup>

                            {/* Europe */}
                            <optgroup label="Europe">
                              <option value="Europe/London">BST (GMT+0100) United Kingdom (London)</option>
                              <option value="Europe/Paris">CEST (GMT+0200) France (Paris)</option>
                              <option value="Europe/Berlin">CEST (GMT+0200) Germany (Berlin)</option>
                              <option value="Europe/Rome">CEST (GMT+0200) Italy (Rome)</option>
                              <option value="Europe/Madrid">CEST (GMT+0200) Spain (Madrid)</option>
                              <option value="Europe/Amsterdam">CEST (GMT+0200) Netherlands (Amsterdam)</option>
                              <option value="Europe/Stockholm">CEST (GMT+0200) Sweden (Stockholm)</option>
                              <option value="Europe/Oslo">CEST (GMT+0200) Norway (Oslo)</option>
                              <option value="Europe/Moscow">MSK (GMT+0300) Russia (Moscow)</option>
                            </optgroup>

                            {/* Asia */}
                            <optgroup label="Asia">
                              <option value="Asia/Tokyo">JST (GMT+0900) Japan (Tokyo)</option>
                              <option value="Asia/Shanghai">CST (GMT+0800) China (Shanghai)</option>
                              <option value="Asia/Seoul">KST (GMT+0900) South Korea (Seoul)</option>
                              <option value="Asia/Singapore">SGT (GMT+0800) Singapore</option>
                              <option value="Asia/Hong_Kong">HKT (GMT+0800) Hong Kong</option>
                              <option value="Asia/Kolkata">IST (GMT+0530) India (Mumbai)</option>
                              <option value="Asia/Bangkok">ICT (GMT+0700) Thailand (Bangkok)</option>
                              <option value="Asia/Manila">PHT (GMT+0800) Philippines (Manila)</option>
                              <option value="Asia/Jakarta">WIB (GMT+0700) Indonesia (Jakarta)</option>
                            </optgroup>

                            {/* Middle East */}
                            <optgroup label="Middle East">
                              <option value="Asia/Dubai">GST (GMT+0400) UAE (Dubai)</option>
                              <option value="Asia/Riyadh">AST (GMT+0300) Saudi Arabia (Riyadh)</option>
                              <option value="Asia/Qatar">AST (GMT+0300) Qatar (Doha)</option>
                              <option value="Asia/Kuwait">AST (GMT+0300) Kuwait City</option>
                              <option value="Asia/Tehran">IRST (GMT+0330) Iran (Tehran)</option>
                              <option value="Asia/Jerusalem">IST (GMT+0300) Israel (Jerusalem)</option>
                            </optgroup>

                            {/* Oceania */}
                            <optgroup label="Oceania">
                              <option value="Australia/Sydney">AEST (GMT+1000) Australia (Sydney)</option>
                              <option value="Australia/Melbourne">AEST (GMT+1000) Australia (Melbourne)</option>
                              <option value="Australia/Perth">AWST (GMT+0800) Australia (Perth)</option>
                              <option value="Pacific/Auckland">NZST (GMT+1200) New Zealand (Auckland)</option>
                              <option value="Pacific/Fiji">FJT (GMT+1200) Fiji</option>
                            </optgroup>

                            {/* Africa */}
                            <optgroup label="Africa">
                              <option value="Africa/Cairo">EET (GMT+0200) Egypt (Cairo)</option>
                              <option value="Africa/Johannesburg">SAST (GMT+0200) South Africa (Johannesburg)</option>
                              <option value="Africa/Lagos">WAT (GMT+0100) Nigeria (Lagos)</option>
                              <option value="Africa/Nairobi">EAT (GMT+0300) Kenya (Nairobi)</option>
                              <option value="Africa/Casablanca">WEST (GMT+0100) Morocco (Casablanca)</option>
                            </optgroup>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="eventDate" className="block text-sm font-medium text-slate-700 mb-1">
                            Event Date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="eventDate"
                              value={eventDate}
                              onChange={(e) => setEventDate(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1">
                            Start Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="startTime"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1">
                            End Time
                          </label>
                          <div className="relative">
                            <input
                              type="time"
                              id="endTime"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-4">
                        <button 
                          type="button" 
                          className="bg-indigo-100 text-indigo-500 px-3 py-1 rounded-md text-sm hover:bg-indigo-200 flex items-center"
                        >
                          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add organizer
                        </button>
                  </div>
                  
                      {/* Event Type Selection */}
                      <div className="flex items-center space-x-6 mt-4 bg-slate-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="radio"
                            id="physical"
                            name="eventType"
                            value="physical"
                            checked={!isOnline}
                            onChange={() => {
                              setIsOnline(false);
                              setEventLink('');
                            }}
                        className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                      />
                          <label htmlFor="physical" className="ml-2 text-sm font-medium text-slate-700 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Physical Event
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                            id="online"
                            name="eventType"
                            value="online"
                            checked={isOnline}
                            onChange={() => setIsOnline(true)}
                        className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                      />
                          <label htmlFor="online" className="ml-2 text-sm font-medium text-slate-700 flex items-center">
                            <svg className="h-4 w-4 mr-1 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Online Event
                      </label>
                    </div>
                  </div>
                      
                      {/* Online Event Link Input */}
                      {isOnline && (
                        <div className="mt-4">
                          <label htmlFor="eventLink" className="block text-sm font-medium text-slate-700 mb-1">
                            Event Link
                          </label>
                          <input
                            type="url"
                            id="eventLink"
                            value={eventLink}
                            onChange={(e) => setEventLink(e.target.value)}
                            placeholder="https://your-event-link.com"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            required={isOnline}
                            pattern="https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)"
                            title="Please enter a valid URL starting with http:// or https://"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Enter a valid URL (e.g., https://zoom.us/j/123456789)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Ticket Section */}
              <div id="ticket" className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-600 text-xl">🎟️</span>
                    <h2 className="text-lg font-medium text-slate-800">Ticket</h2>
                  </div>
                  <button type="button" className="text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  {/* Ticket Type */}
                  <div>
                    <div className="flex space-x-4 mb-6">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="paid"
                          name="ticketType"
                          checked={isPaid}
                          onChange={() => setIsPaid(true)}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <label htmlFor="paid" className="ml-2 text-sm font-medium text-slate-700">
                          Paid
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="free"
                          name="ticketType"
                          checked={!isPaid}
                          onChange={() => setIsPaid(false)}
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                        />
                        <label htmlFor="free" className="ml-2 text-sm font-medium text-slate-700">
                          Free
                        </label>
                      </div>
                    </div>
                    
                    {/* Standard Ticket / Ticket Tiers Toggle */}
                    {isPaid && (
                    <div className="mb-6">
                        <div className="flex items-center mb-4">
                          <input
                            type="checkbox"
                            id="enableTicketTiers"
                            checked={hasTicketTiers}
                            onChange={(e) => setHasTicketTiers(e.target.checked)}
                            className="h-4 w-4 text-indigo-500 focus:ring-indigo-400 rounded"
                          />
                          <label htmlFor="enableTicketTiers" className="ml-2 text-sm font-medium text-slate-700">
                            Enable premium ticket tiers (VIP, etc.)
                          </label>
                      </div>
                    </div>
                    )}
                    
                    {/* Quantity and Price for Standard Ticket */}
                    {isPaid && (
                      <div className="grid grid-cols-1 gap-4 mb-6">
                        <div>
                          <label htmlFor="ticketTitle" className="block text-sm font-medium text-slate-700 mb-1">
                            Ticket Title
                          </label>
                          <input
                            type="text"
                            id="ticketTitle"
                            value={ticketTitle}
                            onChange={(e) => setTicketTitle(e.target.value)}
                            placeholder="Standard Ticket"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              id="quantity"
                              value={quantity}
                              onChange={(e) => setQuantity(e.target.value)}
                              placeholder="200"
                              min="1"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">
                              Price ₦
                            </label>
                            <input
                              type="number"
                              id="price"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="5000"
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Premium Ticket Tiers */}
                    {isPaid && hasTicketTiers && (
                      <div className="space-y-6 mb-6 border border-slate-200 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-700">Premium Ticket Tiers</h3>
                        
                        {ticketTiers.map((tier, index) => (
                          <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-slate-700">Tier {index + 1}</h4>
                              {ticketTiers.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => removeTicketTier(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            <div>
                              <label htmlFor={`title-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                                Tier Title
                              </label>
                              <input
                                type="text"
                                id={`title-${index}`}
                                value={tier.title}
                                onChange={(e) => updateTicketTier(index, 'title', e.target.value)}
                                placeholder="VIP, Premium, etc."
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor={`price-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                                  Price ₦
                                </label>
                                <input
                                  type="number"
                                  id={`price-${index}`}
                                  value={tier.price}
                                  onChange={(e) => updateTicketTier(index, 'price', e.target.value)}
                                  placeholder="5000"
                                  min="0"
                                  step="0.01"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor={`quantity-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  id={`quantity-${index}`}
                                  value={tier.quantity}
                                  onChange={(e) => updateTicketTier(index, 'quantity', e.target.value)}
                                  placeholder="100"
                                  min="1"
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label htmlFor={`description-${index}`} className="block text-sm font-medium text-slate-700 mb-1">
                                Description
                              </label>
                              <textarea
                                id={`description-${index}`}
                                value={tier.description}
                                onChange={(e) => updateTicketTier(index, 'description', e.target.value)}
                                placeholder="Describe what's included with this ticket tier"
                                rows="2"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              ></textarea>
                            </div>
                          </div>
                        ))}
                        
                        <button
                          type="button"
                          onClick={addTicketTier}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add Ticket Tier
                        </button>
                      </div>
                    )}
                    
                    {/* Free event tickets */}
                    {!isPaid && (
                      <div className="mb-6">
                        <label htmlFor="freeQuantity" className="block text-sm font-medium text-slate-700 mb-1">
                          Free Ticket Quantity
                        </label>
                        <input
                          type="number"
                          id="freeQuantity"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="200"
                          min="1"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    
                    {/* Discounts */}
                    <div className={`space-y-4 ${!isPaid ? 'hidden' : ''}`}>
                      <h3 className="text-sm font-medium text-slate-700">Discounts</h3>
                      <p className="text-xs text-slate-500">Set the conditions for your discounts</p>
                      
                      {/* Early bird buys */}
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="earlyBird"
                            checked={hasEarlyBird}
                            onChange={(e) => setHasEarlyBird(e.target.checked)}
                            className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                            />
                          <label htmlFor="earlyBird" className="ml-2 text-sm text-slate-700">
                            Early bird discount
                            </label>
                          </div>
                        
                        {hasEarlyBird && (
                          <div className="pl-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="earlyBirdStartDate" className="block text-xs font-medium text-slate-700 mb-1">
                                  Early Bird Start Date
                                </label>
                            <input
                                  type="date"
                                  id="earlyBirdStartDate"
                                  value={earlyBirdStartDate}
                                  onChange={(e) => setEarlyBirdStartDate(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  disabled={!hasEarlyBird}
                                />
                              </div>
                              <div>
                                <label htmlFor="earlyBirdEndDate" className="block text-xs font-medium text-slate-700 mb-1">
                                  Early Bird End Date
                                </label>
                                <input
                                  type="date"
                                  id="earlyBirdEndDate"
                                  value={earlyBirdEndDate}
                                  onChange={(e) => setEarlyBirdEndDate(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  disabled={!hasEarlyBird}
                                />
                              </div>
                            </div>
                            <div>
                              <label htmlFor="earlyBirdDiscount" className="block text-xs font-medium text-slate-700 mb-1">
                                Discount Percentage
                              </label>
                              <select
                                id="earlyBirdDiscount"
                                value={earlyBirdDiscount}
                                onChange={(e) => setEarlyBirdDiscount(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={!hasEarlyBird}
                              >
                                <option value="">Select discount</option>
                                <option value="10">10% off</option>
                                <option value="20">20% off</option>
                                <option value="30">30% off</option>
                                <option value="40">40% off</option>
                                <option value="50">50% off</option>
                              </select>
                              </div>
                            </div>
                        )}
                        </div>
                        
                      {/* Multiple buys */}
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="multipleBuys"
                            checked={hasMultipleBuys}
                            onChange={(e) => setHasMultipleBuys(e.target.checked)}
                            className="h-4 w-4 text-indigo-500 focus:ring-indigo-400"
                            />
                          <label htmlFor="multipleBuys" className="ml-2 text-sm text-slate-700">
                            Multiple tickets discount
                            </label>
                          </div>
                        
                        {hasMultipleBuys && (
                          <div className="pl-6 space-y-4">
                            <div>
                              <label htmlFor="multipleBuysMinTickets" className="block text-xs font-medium text-slate-700 mb-1">
                                Minimum Tickets to Qualify
                              </label>
                            <input
                              type="number"
                                id="multipleBuysMinTickets"
                                value={multipleBuysMinTickets}
                                onChange={(e) => setMultipleBuysMinTickets(e.target.value)}
                                min="2"
                                placeholder="2"
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={!hasMultipleBuys}
                              />
                              <p className="mt-1 text-xs text-slate-500">Minimum number of tickets a buyer needs to purchase to receive the discount</p>
                            </div>
                            <div>
                              <label htmlFor="multipleBuysDiscount" className="block text-xs font-medium text-slate-700 mb-1">
                                Discount Percentage
                              </label>
                              <select
                                id="multipleBuysDiscount"
                                value={multipleBuysDiscount}
                                onChange={(e) => setMultipleBuysDiscount(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                disabled={!hasMultipleBuys}
                              >
                                <option value="">Select discount</option>
                                <option value="10">10% off</option>
                                <option value="20">20% off</option>
                                <option value="30">30% off</option>
                                <option value="40">40% off</option>
                                <option value="50">50% off</option>
                              </select>
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                    
                    
                    {/* Promotion */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-slate-700">Promotion</h3>
                        <div className="relative inline-block w-12 align-middle select-none">
                          <input 
                            type="checkbox" 
                            id="promotion" 
                            checked={isPromotionEnabled}
                            onChange={(e) => setIsPromotionEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <label 
                            htmlFor="promotion"
                            className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer peer-checked:bg-indigo-600 transition-colors duration-200"
                          ></label>
                          <span 
                            className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${
                              isPromotionEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          ></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || uploadingCover}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg hover:from-indigo-700 hover:to-blue-600 transition-all duration-300 shadow-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Next'}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 shadow-sm flex items-start">
                  <svg className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Error: {error}</p>
                    <p className="text-sm mt-1">Please correct the error and try again.</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateEvent() {
  return <CreateEventContent />;
} 