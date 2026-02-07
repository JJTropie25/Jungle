import React, { createContext, useContext, useMemo, useState } from "react";

export type Language = "en" | "it" | "es" | "zh";

type Translations = Record<Language, Record<string, string>>;

const translations: Translations = {
  en: {
    "tabs.home": "Home",
    "tabs.favourites": "Favourites",
    "tabs.bookings": "Bookings",
    "tabs.profile": "Profile",
    "bookings.title": "Your bookings",
    "favorites.title": "Your favourites",

    "profile.editInfo": "Edit personal info",
    "profile.changeLanguage": "Change language",
    "profile.logout": "Logout",
    "profile.logoutNotImplemented": "Logout action not implemented yet.",

    "edit.title": "Personal info",
    "edit.username": "Username",
    "edit.email": "Email",
    "edit.password": "Password",
    "edit.changePhoto": "Change photo",
    "edit.becomeHost": "Become a host",
    "edit.saveChanges": "Save changes",

    "language.title": "Language",
    "language.english": "English",
    "language.italian": "Italian",
    "language.spanish": "Spanish",
    "language.chinese": "Chinese (Mandarin)",

    "home.recentlyViewed": "Recently viewed",
    "home.aroundYou": "Around you",
    "home.search": "Search",
    "home.destination": "Destination",
    "home.date": "Date",
    "home.time": "Time",
    "home.people": "People",

    "category.rest": "Rest",
    "category.shower": "Shower",
    "category.storage": "Storage",

    "search.sort.priceUp": "Price Up",
    "search.sort.priceDown": "Price Down",
    "search.sort.topRated": "Top rated",
    "search.sort.nearest": "Nearest",
    "search.sort": "Sort",
    "search.filter": "Filter",
    "search.filter.all": "All",
    "search.filter.price": "Price",
    "search.filter.distance": "Distance",
    "search.filter.rating": "Rating",
    "search.map": "Map",
    "search.list": "List",
    "search.maxPrice": "Max price: EUR {value}",
    "search.maxDistance": "Max distance: {value} km",
    "search.minRating": "Min rating: {value}",
    "label.rating": "Rating",
    "day.today": "Today",
    "day.tomorrow": "Tomorrow",
    "day.friday": "Friday",
    "day.weekend": "This weekend",

    "booking.thankYou": "Thank you for your booking",
    "booking.manageTitle": "Manage booking",
    "booking.accessQr": "Access with this QR code",
    "booking.qrCode": "QR CODE",
    "booking.getDirections": "Get directions",
    "booking.manage": "Manage booking",
    "booking.cancel": "Cancel booking",
    "booking.contact": "Contact the property",

    "service.availableTimes": "Available times",
    "service.bookNow": "Book now",
  },
  it: {
    "tabs.home": "Home",
    "tabs.favourites": "Preferiti",
    "tabs.bookings": "Prenotazioni",
    "tabs.profile": "Profilo",
    "bookings.title": "Le tue prenotazioni",
    "favorites.title": "I tuoi preferiti",

    "profile.editInfo": "Modifica dati personali",
    "profile.changeLanguage": "Cambia lingua",
    "profile.logout": "Logout",
    "profile.logoutNotImplemented": "Logout non ancora implementato.",

    "edit.title": "Dati personali",
    "edit.username": "Username",
    "edit.email": "Email",
    "edit.password": "Password",
    "edit.changePhoto": "Cambia foto",
    "edit.becomeHost": "Diventa host",
    "edit.saveChanges": "Salva modifiche",

    "language.title": "Lingua",
    "language.english": "Inglese",
    "language.italian": "Italiano",
    "language.spanish": "Spagnolo",
    "language.chinese": "Cinese (Mandarino)",

    "home.recentlyViewed": "Visti di recente",
    "home.aroundYou": "Intorno a te",
    "home.search": "Cerca",
    "home.destination": "Destinazione",
    "home.date": "Data",
    "home.time": "Ora",
    "home.people": "Persone",

    "category.rest": "Riposo",
    "category.shower": "Doccia",
    "category.storage": "Deposito",

    "search.sort.priceUp": "Prezzo su",
    "search.sort.priceDown": "Prezzo giu",
    "search.sort.topRated": "Piu votati",
    "search.sort.nearest": "Piu vicini",
    "search.sort": "Ordina",
    "search.filter": "Filtra",
    "search.filter.all": "Tutti",
    "search.filter.price": "Prezzo",
    "search.filter.distance": "Distanza",
    "search.filter.rating": "Voto",
    "search.map": "Mappa",
    "search.list": "Lista",
    "search.maxPrice": "Prezzo max: EUR {value}",
    "search.maxDistance": "Distanza max: {value} km",
    "search.minRating": "Voto min: {value}",
    "label.rating": "Voto",
    "day.today": "Oggi",
    "day.tomorrow": "Domani",
    "day.friday": "Venerdi",
    "day.weekend": "Questo weekend",

    "booking.thankYou": "Grazie per la tua prenotazione",
    "booking.manageTitle": "Gestisci prenotazione",
    "booking.accessQr": "Accedi con questo QR code",
    "booking.qrCode": "QR CODE",
    "booking.getDirections": "Indicazioni",
    "booking.manage": "Gestisci prenotazione",
    "booking.cancel": "Annulla prenotazione",
    "booking.contact": "Contatta la struttura",

    "service.availableTimes": "Orari disponibili",
    "service.bookNow": "Prenota ora",
  },
  es: {
    "tabs.home": "Inicio",
    "tabs.favourites": "Favoritos",
    "tabs.bookings": "Reservas",
    "tabs.profile": "Perfil",
    "bookings.title": "Tus reservas",
    "favorites.title": "Tus favoritos",

    "profile.editInfo": "Editar datos personales",
    "profile.changeLanguage": "Cambiar idioma",
    "profile.logout": "Cerrar sesion",
    "profile.logoutNotImplemented": "Accion de cierre no implementada.",

    "edit.title": "Datos personales",
    "edit.username": "Usuario",
    "edit.email": "Email",
    "edit.password": "Contrasena",
    "edit.changePhoto": "Cambiar foto",
    "edit.becomeHost": "Convertirse en anfitrion",
    "edit.saveChanges": "Guardar cambios",

    "language.title": "Idioma",
    "language.english": "Ingles",
    "language.italian": "Italiano",
    "language.spanish": "Espanol",
    "language.chinese": "Chino (Mandarin)",

    "home.recentlyViewed": "Vistos recientemente",
    "home.aroundYou": "Cerca de ti",
    "home.search": "Buscar",
    "home.destination": "Destino",
    "home.date": "Fecha",
    "home.time": "Hora",
    "home.people": "Personas",

    "category.rest": "Descanso",
    "category.shower": "Ducha",
    "category.storage": "Guardaequipaje",

    "search.sort.priceUp": "Precio arriba",
    "search.sort.priceDown": "Precio abajo",
    "search.sort.topRated": "Mejor valorados",
    "search.sort.nearest": "Mas cercanos",
    "search.sort": "Ordenar",
    "search.filter": "Filtrar",
    "search.filter.all": "Todos",
    "search.filter.price": "Precio",
    "search.filter.distance": "Distancia",
    "search.filter.rating": "Valoracion",
    "search.map": "Mapa",
    "search.list": "Lista",
    "search.maxPrice": "Precio max: EUR {value}",
    "search.maxDistance": "Distancia max: {value} km",
    "search.minRating": "Valoracion min: {value}",
    "label.rating": "Valoracion",
    "day.today": "Hoy",
    "day.tomorrow": "Manana",
    "day.friday": "Viernes",
    "day.weekend": "Este fin de semana",

    "booking.thankYou": "Gracias por tu reserva",
    "booking.manageTitle": "Gestionar reserva",
    "booking.accessQr": "Accede con este QR",
    "booking.qrCode": "QR CODE",
    "booking.getDirections": "Como llegar",
    "booking.manage": "Gestionar reserva",
    "booking.cancel": "Cancelar reserva",
    "booking.contact": "Contactar al alojamiento",

    "service.availableTimes": "Horarios disponibles",
    "service.bookNow": "Reservar ahora",
  },
  zh: {
    "tabs.home": "??",
    "tabs.favourites": "??",
    "tabs.bookings": "??",
    "tabs.profile": "??",
    "bookings.title": "????",
    "favorites.title": "????",

    "profile.editInfo": "??????",
    "profile.changeLanguage": "????",
    "profile.logout": "????",
    "profile.logoutNotImplemented": "?????????",

    "edit.title": "????",
    "edit.username": "???",
    "edit.email": "??",
    "edit.password": "??",
    "edit.changePhoto": "????",
    "edit.becomeHost": "????",
    "edit.saveChanges": "????",

    "language.title": "??",
    "language.english": "??",
    "language.italian": "????",
    "language.spanish": "????",
    "language.chinese": "???????",

    "home.recentlyViewed": "????",
    "home.aroundYou": "??",
    "home.search": "??",
    "home.destination": "???",
    "home.date": "??",
    "home.time": "??",
    "home.people": "??",

    "category.rest": "??",
    "category.shower": "??",
    "category.storage": "??",

    "search.sort.priceUp": "????",
    "search.sort.priceDown": "????",
    "search.sort.topRated": "????",
    "search.sort.nearest": "??",
    "search.sort": "??",
    "search.filter": "??",
    "search.filter.all": "??",
    "search.filter.price": "??",
    "search.filter.distance": "??",
    "search.filter.rating": "??",
    "search.map": "??",
    "search.list": "??",
    "search.maxPrice": "????: EUR {value}",
    "search.maxDistance": "????: {value} km",
    "search.minRating": "????: {value}",
    "label.rating": "??",
    "day.today": "??",
    "day.tomorrow": "??",
    "day.friday": "??",
    "day.weekend": "???",

    "booking.thankYou": "??????",
    "booking.manageTitle": "????",
    "booking.accessQr": "????????",
    "booking.qrCode": "???",
    "booking.getDirections": "??",
    "booking.manage": "????",
    "booking.cancel": "????",
    "booking.contact": "????",

    "service.availableTimes": "????",
    "service.bookNow": "????",
  },
};


type I18nContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const dict = translations[language] ?? translations.en;
      let str = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    };
    return { language, setLanguage, t };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
