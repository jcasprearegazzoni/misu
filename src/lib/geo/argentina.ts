// Datos geográficos de Argentina: provincias y municipios/partidos.
// Fuente: nomenclatura oficial del INDEC / datos.gob.ar
// Buenos Aires incluye los 135 partidos completos.
// Resto de provincias incluye municipios principales.

export type Provincia = {
  id: string;
  nombre: string;
};

export type Municipio = {
  nombre: string;
  provinciaId: string;
};

export const PROVINCIAS: Provincia[] = [
  { id: "caba", nombre: "Ciudad Autónoma de Buenos Aires" },
  { id: "buenos-aires", nombre: "Buenos Aires" },
  { id: "catamarca", nombre: "Catamarca" },
  { id: "chaco", nombre: "Chaco" },
  { id: "chubut", nombre: "Chubut" },
  { id: "cordoba", nombre: "Córdoba" },
  { id: "corrientes", nombre: "Corrientes" },
  { id: "entre-rios", nombre: "Entre Ríos" },
  { id: "formosa", nombre: "Formosa" },
  { id: "jujuy", nombre: "Jujuy" },
  { id: "la-pampa", nombre: "La Pampa" },
  { id: "la-rioja", nombre: "La Rioja" },
  { id: "mendoza", nombre: "Mendoza" },
  { id: "misiones", nombre: "Misiones" },
  { id: "neuquen", nombre: "Neuquén" },
  { id: "rio-negro", nombre: "Río Negro" },
  { id: "salta", nombre: "Salta" },
  { id: "san-juan", nombre: "San Juan" },
  { id: "san-luis", nombre: "San Luis" },
  { id: "santa-cruz", nombre: "Santa Cruz" },
  { id: "santa-fe", nombre: "Santa Fe" },
  { id: "santiago-del-estero", nombre: "Santiago del Estero" },
  { id: "tierra-del-fuego", nombre: "Tierra del Fuego" },
  { id: "tucuman", nombre: "Tucumán" },
];

export const MUNICIPIOS: Municipio[] = [
  // ─── Ciudad Autónoma de Buenos Aires — 48 barrios oficiales ───
  { nombre: "Agronomía", provinciaId: "caba" },
  { nombre: "Almagro", provinciaId: "caba" },
  { nombre: "Balvanera", provinciaId: "caba" },
  { nombre: "Barracas", provinciaId: "caba" },
  { nombre: "Belgrano", provinciaId: "caba" },
  { nombre: "Boedo", provinciaId: "caba" },
  { nombre: "Caballito", provinciaId: "caba" },
  { nombre: "Chacarita", provinciaId: "caba" },
  { nombre: "Coghlan", provinciaId: "caba" },
  { nombre: "Colegiales", provinciaId: "caba" },
  { nombre: "Constitución", provinciaId: "caba" },
  { nombre: "Flores", provinciaId: "caba" },
  { nombre: "Floresta", provinciaId: "caba" },
  { nombre: "La Boca", provinciaId: "caba" },
  { nombre: "La Paternal", provinciaId: "caba" },
  { nombre: "Liniers", provinciaId: "caba" },
  { nombre: "Mataderos", provinciaId: "caba" },
  { nombre: "Monte Castro", provinciaId: "caba" },
  { nombre: "Montserrat", provinciaId: "caba" },
  { nombre: "Nueva Pompeya", provinciaId: "caba" },
  { nombre: "Núñez", provinciaId: "caba" },
  { nombre: "Palermo", provinciaId: "caba" },
  { nombre: "Parque Avellaneda", provinciaId: "caba" },
  { nombre: "Parque Chacabuco", provinciaId: "caba" },
  { nombre: "Parque Chas", provinciaId: "caba" },
  { nombre: "Parque Patricios", provinciaId: "caba" },
  { nombre: "Puerto Madero", provinciaId: "caba" },
  { nombre: "Recoleta", provinciaId: "caba" },
  { nombre: "Retiro", provinciaId: "caba" },
  { nombre: "Saavedra", provinciaId: "caba" },
  { nombre: "San Cristóbal", provinciaId: "caba" },
  { nombre: "San Nicolás", provinciaId: "caba" },
  { nombre: "San Telmo", provinciaId: "caba" },
  { nombre: "Versalles", provinciaId: "caba" },
  { nombre: "Villa Crespo", provinciaId: "caba" },
  { nombre: "Villa del Parque", provinciaId: "caba" },
  { nombre: "Villa Devoto", provinciaId: "caba" },
  { nombre: "Villa Gral. Mitre", provinciaId: "caba" },
  { nombre: "Villa Lugano", provinciaId: "caba" },
  { nombre: "Villa Luro", provinciaId: "caba" },
  { nombre: "Villa Ortúzar", provinciaId: "caba" },
  { nombre: "Villa Pueyrredón", provinciaId: "caba" },
  { nombre: "Villa Real", provinciaId: "caba" },
  { nombre: "Villa Riachuelo", provinciaId: "caba" },
  { nombre: "Villa Santa Rita", provinciaId: "caba" },
  { nombre: "Villa Soldati", provinciaId: "caba" },
  { nombre: "Villa Urquiza", provinciaId: "caba" },
  { nombre: "Villa Vélez Sársfield", provinciaId: "caba" },

  // ─── Buenos Aires — 135 partidos ───
  { nombre: "Adolfo Alsina", provinciaId: "buenos-aires" },
  { nombre: "Adolfo Gonzales Chaves", provinciaId: "buenos-aires" },
  { nombre: "Alberti", provinciaId: "buenos-aires" },
  { nombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Arrecifes", provinciaId: "buenos-aires" },
  { nombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Ayacucho", provinciaId: "buenos-aires" },
  { nombre: "Azul", provinciaId: "buenos-aires" },
  { nombre: "Bahía Blanca", provinciaId: "buenos-aires" },
  { nombre: "Balcarce", provinciaId: "buenos-aires" },
  { nombre: "Baradero", provinciaId: "buenos-aires" },
  { nombre: "Benito Juárez", provinciaId: "buenos-aires" },
  { nombre: "Berazategui", provinciaId: "buenos-aires" },
  { nombre: "Berisso", provinciaId: "buenos-aires" },
  { nombre: "Bolívar", provinciaId: "buenos-aires" },
  { nombre: "Bragado", provinciaId: "buenos-aires" },
  { nombre: "Brandsen", provinciaId: "buenos-aires" },
  { nombre: "Campana", provinciaId: "buenos-aires" },
  { nombre: "Cañuelas", provinciaId: "buenos-aires" },
  { nombre: "Capitán Sarmiento", provinciaId: "buenos-aires" },
  { nombre: "Carlos Casares", provinciaId: "buenos-aires" },
  { nombre: "Carlos Tejedor", provinciaId: "buenos-aires" },
  { nombre: "Carmen de Areco", provinciaId: "buenos-aires" },
  { nombre: "Chascomús", provinciaId: "buenos-aires" },
  { nombre: "Chivilcoy", provinciaId: "buenos-aires" },
  { nombre: "Colón", provinciaId: "buenos-aires" },
  { nombre: "Coronel Dorrego", provinciaId: "buenos-aires" },
  { nombre: "Coronel Pringles", provinciaId: "buenos-aires" },
  { nombre: "Coronel Rosales", provinciaId: "buenos-aires" },
  { nombre: "Coronel Suárez", provinciaId: "buenos-aires" },
  { nombre: "Daireaux", provinciaId: "buenos-aires" },
  { nombre: "Dolores", provinciaId: "buenos-aires" },
  { nombre: "Ensenada", provinciaId: "buenos-aires" },
  { nombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Esteban Echeverría", provinciaId: "buenos-aires" },
  { nombre: "Exaltación de la Cruz", provinciaId: "buenos-aires" },
  { nombre: "Ezeiza", provinciaId: "buenos-aires" },
  { nombre: "Florencio Varela", provinciaId: "buenos-aires" },
  { nombre: "Florentino Ameghino", provinciaId: "buenos-aires" },
  { nombre: "General Alvarado", provinciaId: "buenos-aires" },
  { nombre: "General Alvear", provinciaId: "buenos-aires" },
  { nombre: "General Arenales", provinciaId: "buenos-aires" },
  { nombre: "General Belgrano", provinciaId: "buenos-aires" },
  { nombre: "General Guido", provinciaId: "buenos-aires" },
  { nombre: "General Juan Madariaga", provinciaId: "buenos-aires" },
  { nombre: "General La Madrid", provinciaId: "buenos-aires" },
  { nombre: "General Las Heras", provinciaId: "buenos-aires" },
  { nombre: "General Lavalle", provinciaId: "buenos-aires" },
  { nombre: "General Paz", provinciaId: "buenos-aires" },
  { nombre: "General Pinto", provinciaId: "buenos-aires" },
  { nombre: "General Pueyrredón", provinciaId: "buenos-aires" },
  { nombre: "General Rodríguez", provinciaId: "buenos-aires" },
  { nombre: "General Salliqueló", provinciaId: "buenos-aires" },
  { nombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "General Viamonte", provinciaId: "buenos-aires" },
  { nombre: "General Villegas", provinciaId: "buenos-aires" },
  { nombre: "Guaminí", provinciaId: "buenos-aires" },
  { nombre: "Hipólito Yrigoyen", provinciaId: "buenos-aires" },
  { nombre: "Hurlingham", provinciaId: "buenos-aires" },
  { nombre: "Ituzaingó", provinciaId: "buenos-aires" },
  { nombre: "José C. Paz", provinciaId: "buenos-aires" },
  { nombre: "Junín", provinciaId: "buenos-aires" },
  { nombre: "La Costa", provinciaId: "buenos-aires" },
  { nombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Lanús", provinciaId: "buenos-aires" },
  { nombre: "Laprida", provinciaId: "buenos-aires" },
  { nombre: "Las Flores", provinciaId: "buenos-aires" },
  { nombre: "Leandro N. Alem", provinciaId: "buenos-aires" },
  { nombre: "Lincoln", provinciaId: "buenos-aires" },
  { nombre: "Lobería", provinciaId: "buenos-aires" },
  { nombre: "Lobos", provinciaId: "buenos-aires" },
  { nombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Luján", provinciaId: "buenos-aires" },
  { nombre: "Magdalena", provinciaId: "buenos-aires" },
  { nombre: "Maipú", provinciaId: "buenos-aires" },
  { nombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },
  { nombre: "Mar Chiquita", provinciaId: "buenos-aires" },
  { nombre: "Marcos Paz", provinciaId: "buenos-aires" },
  { nombre: "Mercedes", provinciaId: "buenos-aires" },
  { nombre: "Merlo", provinciaId: "buenos-aires" },
  { nombre: "Monte", provinciaId: "buenos-aires" },
  { nombre: "Monte Hermoso", provinciaId: "buenos-aires" },
  { nombre: "Moreno", provinciaId: "buenos-aires" },
  { nombre: "Morón", provinciaId: "buenos-aires" },
  { nombre: "Navarro", provinciaId: "buenos-aires" },
  { nombre: "Necochea", provinciaId: "buenos-aires" },
  { nombre: "Nueve de Julio", provinciaId: "buenos-aires" },
  { nombre: "Olavarría", provinciaId: "buenos-aires" },
  { nombre: "Patagones", provinciaId: "buenos-aires" },
  { nombre: "Pehuajó", provinciaId: "buenos-aires" },
  { nombre: "Pellegrini", provinciaId: "buenos-aires" },
  { nombre: "Pergamino", provinciaId: "buenos-aires" },
  { nombre: "Pila", provinciaId: "buenos-aires" },
  { nombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Pinamar", provinciaId: "buenos-aires" },
  { nombre: "Presidente Perón", provinciaId: "buenos-aires" },
  { nombre: "Puán", provinciaId: "buenos-aires" },
  { nombre: "Punta Indio", provinciaId: "buenos-aires" },
  { nombre: "Quilmes", provinciaId: "buenos-aires" },
  { nombre: "Ramallo", provinciaId: "buenos-aires" },
  { nombre: "Rauch", provinciaId: "buenos-aires" },
  { nombre: "Rivadavia", provinciaId: "buenos-aires" },
  { nombre: "Rojas", provinciaId: "buenos-aires" },
  { nombre: "Roque Pérez", provinciaId: "buenos-aires" },
  { nombre: "Saavedra", provinciaId: "buenos-aires" },
  { nombre: "Saladillo", provinciaId: "buenos-aires" },
  { nombre: "Salliqueló", provinciaId: "buenos-aires" },
  { nombre: "Salto", provinciaId: "buenos-aires" },
  { nombre: "San Andrés de Giles", provinciaId: "buenos-aires" },
  { nombre: "San Antonio de Areco", provinciaId: "buenos-aires" },
  { nombre: "San Cayetano", provinciaId: "buenos-aires" },
  { nombre: "San Fernando", provinciaId: "buenos-aires" },
  { nombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "San Miguel", provinciaId: "buenos-aires" },
  { nombre: "San Nicolás", provinciaId: "buenos-aires" },
  { nombre: "San Pedro", provinciaId: "buenos-aires" },
  { nombre: "San Vicente", provinciaId: "buenos-aires" },
  { nombre: "Suipacha", provinciaId: "buenos-aires" },
  { nombre: "Tandil", provinciaId: "buenos-aires" },
  { nombre: "Tapalqué", provinciaId: "buenos-aires" },
  { nombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Tordillo", provinciaId: "buenos-aires" },
  { nombre: "Tornquist", provinciaId: "buenos-aires" },
  { nombre: "Trenque Lauquen", provinciaId: "buenos-aires" },
  { nombre: "Tres Arroyos", provinciaId: "buenos-aires" },
  { nombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "Tres Lomas", provinciaId: "buenos-aires" },
  { nombre: "Veinticinco de Mayo", provinciaId: "buenos-aires" },
  { nombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Villarino", provinciaId: "buenos-aires" },
  { nombre: "Zárate", provinciaId: "buenos-aires" },

  // ─── Catamarca ───
  { nombre: "Ambato", provinciaId: "catamarca" },
  { nombre: "Ancasti", provinciaId: "catamarca" },
  { nombre: "Andalgalá", provinciaId: "catamarca" },
  { nombre: "Antofagasta de la Sierra", provinciaId: "catamarca" },
  { nombre: "Belén", provinciaId: "catamarca" },
  { nombre: "Capayán", provinciaId: "catamarca" },
  { nombre: "El Alto", provinciaId: "catamarca" },
  { nombre: "Fray Mamerto Esquiú", provinciaId: "catamarca" },
  { nombre: "La Paz", provinciaId: "catamarca" },
  { nombre: "Paclín", provinciaId: "catamarca" },
  { nombre: "Pomán", provinciaId: "catamarca" },
  { nombre: "San Fernando del Valle de Catamarca", provinciaId: "catamarca" },
  { nombre: "Santa María", provinciaId: "catamarca" },
  { nombre: "Santa Rosa", provinciaId: "catamarca" },
  { nombre: "Tinogasta", provinciaId: "catamarca" },
  { nombre: "Valle Viejo", provinciaId: "catamarca" },

  // ─── Chaco ───
  { nombre: "Almirante Brown", provinciaId: "chaco" },
  { nombre: "Chacabuco", provinciaId: "chaco" },
  { nombre: "Comandante Fernández", provinciaId: "chaco" },
  { nombre: "Doce de Octubre", provinciaId: "chaco" },
  { nombre: "Dos de Abril", provinciaId: "chaco" },
  { nombre: "Fray Justo Santa María de Oro", provinciaId: "chaco" },
  { nombre: "General Belgrano", provinciaId: "chaco" },
  { nombre: "General Donovan", provinciaId: "chaco" },
  { nombre: "General Güemes", provinciaId: "chaco" },
  { nombre: "Independencia", provinciaId: "chaco" },
  { nombre: "Libertad", provinciaId: "chaco" },
  { nombre: "Libertador General San Martín", provinciaId: "chaco" },
  { nombre: "Maipú", provinciaId: "chaco" },
  { nombre: "Mayor Luis J. Fontana", provinciaId: "chaco" },
  { nombre: "Nueve de Julio", provinciaId: "chaco" },
  { nombre: "O'Higgins", provinciaId: "chaco" },
  { nombre: "Presidencia de la Plaza", provinciaId: "chaco" },
  { nombre: "Quitilipi", provinciaId: "chaco" },
  { nombre: "Resistencia", provinciaId: "chaco" },
  { nombre: "San Lorenzo", provinciaId: "chaco" },
  { nombre: "Sargento Cabral", provinciaId: "chaco" },
  { nombre: "Tapenagá", provinciaId: "chaco" },
  { nombre: "Veinticinco de Mayo", provinciaId: "chaco" },

  // ─── Chubut ───
  { nombre: "Comodoro Rivadavia", provinciaId: "chubut" },
  { nombre: "Esquel", provinciaId: "chubut" },
  { nombre: "Gaiman", provinciaId: "chubut" },
  { nombre: "Puerto Madryn", provinciaId: "chubut" },
  { nombre: "Rawson", provinciaId: "chubut" },
  { nombre: "Río Senguer", provinciaId: "chubut" },
  { nombre: "Sarmiento", provinciaId: "chubut" },
  { nombre: "Trelew", provinciaId: "chubut" },

  // ─── Córdoba ───
  { nombre: "Alta Gracia", provinciaId: "cordoba" },
  { nombre: "Bell Ville", provinciaId: "cordoba" },
  { nombre: "Córdoba", provinciaId: "cordoba" },
  { nombre: "Cruz del Eje", provinciaId: "cordoba" },
  { nombre: "Dean Funes", provinciaId: "cordoba" },
  { nombre: "Jesús María", provinciaId: "cordoba" },
  { nombre: "La Falda", provinciaId: "cordoba" },
  { nombre: "Marcos Juárez", provinciaId: "cordoba" },
  { nombre: "Río Cuarto", provinciaId: "cordoba" },
  { nombre: "Río Tercero", provinciaId: "cordoba" },
  { nombre: "San Francisco", provinciaId: "cordoba" },
  { nombre: "Villa Carlos Paz", provinciaId: "cordoba" },
  { nombre: "Villa Dolores", provinciaId: "cordoba" },
  { nombre: "Villa María", provinciaId: "cordoba" },
  { nombre: "Villa Nueva", provinciaId: "cordoba" },

  // ─── Corrientes ───
  { nombre: "Bella Vista", provinciaId: "corrientes" },
  { nombre: "Corrientes", provinciaId: "corrientes" },
  { nombre: "Curuzú Cuatiá", provinciaId: "corrientes" },
  { nombre: "Goya", provinciaId: "corrientes" },
  { nombre: "Ituzaingó", provinciaId: "corrientes" },
  { nombre: "Mercedes", provinciaId: "corrientes" },
  { nombre: "Monte Caseros", provinciaId: "corrientes" },
  { nombre: "Paso de los Libres", provinciaId: "corrientes" },
  { nombre: "Santo Tomé", provinciaId: "corrientes" },

  // ─── Entre Ríos ───
  { nombre: "Colón", provinciaId: "entre-rios" },
  { nombre: "Concordia", provinciaId: "entre-rios" },
  { nombre: "Concepción del Uruguay", provinciaId: "entre-rios" },
  { nombre: "Gualeguay", provinciaId: "entre-rios" },
  { nombre: "Gualeguaychú", provinciaId: "entre-rios" },
  { nombre: "La Paz", provinciaId: "entre-rios" },
  { nombre: "Nogoyá", provinciaId: "entre-rios" },
  { nombre: "Paraná", provinciaId: "entre-rios" },
  { nombre: "Victoria", provinciaId: "entre-rios" },
  { nombre: "Villaguay", provinciaId: "entre-rios" },

  // ─── Formosa ───
  { nombre: "Clorinda", provinciaId: "formosa" },
  { nombre: "Formosa", provinciaId: "formosa" },
  { nombre: "Ingeniero Juárez", provinciaId: "formosa" },
  { nombre: "Pirané", provinciaId: "formosa" },

  // ─── Jujuy ───
  { nombre: "El Carmen", provinciaId: "jujuy" },
  { nombre: "Humahuaca", provinciaId: "jujuy" },
  { nombre: "Ledesma", provinciaId: "jujuy" },
  { nombre: "Libertador General San Martín", provinciaId: "jujuy" },
  { nombre: "Palpalá", provinciaId: "jujuy" },
  { nombre: "San Pedro de Jujuy", provinciaId: "jujuy" },
  { nombre: "San Salvador de Jujuy", provinciaId: "jujuy" },
  { nombre: "Tilcara", provinciaId: "jujuy" },

  // ─── La Pampa ───
  { nombre: "General Acha", provinciaId: "la-pampa" },
  { nombre: "General Pico", provinciaId: "la-pampa" },
  { nombre: "Realicó", provinciaId: "la-pampa" },
  { nombre: "Santa Rosa", provinciaId: "la-pampa" },
  { nombre: "Toay", provinciaId: "la-pampa" },

  // ─── La Rioja ───
  { nombre: "Chilecito", provinciaId: "la-rioja" },
  { nombre: "La Rioja", provinciaId: "la-rioja" },
  { nombre: "Chamical", provinciaId: "la-rioja" },
  { nombre: "Aimogasta", provinciaId: "la-rioja" },

  // ─── Mendoza ───
  { nombre: "General Alvear", provinciaId: "mendoza" },
  { nombre: "Godoy Cruz", provinciaId: "mendoza" },
  { nombre: "Guaymallén", provinciaId: "mendoza" },
  { nombre: "Junín", provinciaId: "mendoza" },
  { nombre: "Las Heras", provinciaId: "mendoza" },
  { nombre: "Lavalle", provinciaId: "mendoza" },
  { nombre: "Luján de Cuyo", provinciaId: "mendoza" },
  { nombre: "Maipú", provinciaId: "mendoza" },
  { nombre: "Malargüe", provinciaId: "mendoza" },
  { nombre: "Mendoza", provinciaId: "mendoza" },
  { nombre: "Rivadavia", provinciaId: "mendoza" },
  { nombre: "San Carlos", provinciaId: "mendoza" },
  { nombre: "San Martín", provinciaId: "mendoza" },
  { nombre: "San Rafael", provinciaId: "mendoza" },
  { nombre: "Santa Rosa", provinciaId: "mendoza" },
  { nombre: "Tunuyán", provinciaId: "mendoza" },
  { nombre: "Tupungato", provinciaId: "mendoza" },

  // ─── Misiones ───
  { nombre: "Apóstoles", provinciaId: "misiones" },
  { nombre: "Eldorado", provinciaId: "misiones" },
  { nombre: "Oberá", provinciaId: "misiones" },
  { nombre: "Posadas", provinciaId: "misiones" },
  { nombre: "Puerto Iguazú", provinciaId: "misiones" },

  // ─── Neuquén ───
  { nombre: "Chos Malal", provinciaId: "neuquen" },
  { nombre: "Cutral Có", provinciaId: "neuquen" },
  { nombre: "Junín de los Andes", provinciaId: "neuquen" },
  { nombre: "Neuquén", provinciaId: "neuquen" },
  { nombre: "San Martín de los Andes", provinciaId: "neuquen" },
  { nombre: "Villa La Angostura", provinciaId: "neuquen" },
  { nombre: "Zapala", provinciaId: "neuquen" },

  // ─── Río Negro ───
  { nombre: "Bariloche", provinciaId: "rio-negro" },
  { nombre: "Catriel", provinciaId: "rio-negro" },
  { nombre: "Cipolletti", provinciaId: "rio-negro" },
  { nombre: "El Bolsón", provinciaId: "rio-negro" },
  { nombre: "General Roca", provinciaId: "rio-negro" },
  { nombre: "San Antonio Oeste", provinciaId: "rio-negro" },
  { nombre: "Viedma", provinciaId: "rio-negro" },
  { nombre: "Villa Regina", provinciaId: "rio-negro" },

  // ─── Salta ───
  { nombre: "Cafayate", provinciaId: "salta" },
  { nombre: "Cachi", provinciaId: "salta" },
  { nombre: "General Güemes", provinciaId: "salta" },
  { nombre: "Metán", provinciaId: "salta" },
  { nombre: "Orán", provinciaId: "salta" },
  { nombre: "Rosario de la Frontera", provinciaId: "salta" },
  { nombre: "Salta", provinciaId: "salta" },
  { nombre: "Tartagal", provinciaId: "salta" },

  // ─── San Juan ───
  { nombre: "Caucete", provinciaId: "san-juan" },
  { nombre: "Chimbas", provinciaId: "san-juan" },
  { nombre: "Rawson", provinciaId: "san-juan" },
  { nombre: "Rivadavia", provinciaId: "san-juan" },
  { nombre: "San Juan", provinciaId: "san-juan" },
  { nombre: "Santa Lucía", provinciaId: "san-juan" },
  { nombre: "Pocito", provinciaId: "san-juan" },

  // ─── San Luis ───
  { nombre: "Merlo", provinciaId: "san-luis" },
  { nombre: "San Luis", provinciaId: "san-luis" },
  { nombre: "Villa Mercedes", provinciaId: "san-luis" },

  // ─── Santa Cruz ───
  { nombre: "Caleta Olivia", provinciaId: "santa-cruz" },
  { nombre: "El Calafate", provinciaId: "santa-cruz" },
  { nombre: "Puerto Deseado", provinciaId: "santa-cruz" },
  { nombre: "Río Gallegos", provinciaId: "santa-cruz" },
  { nombre: "Río Turbio", provinciaId: "santa-cruz" },

  // ─── Santa Fe ───
  { nombre: "Rafaela", provinciaId: "santa-fe" },
  { nombre: "Reconquista", provinciaId: "santa-fe" },
  { nombre: "Rosario", provinciaId: "santa-fe" },
  { nombre: "Santa Fe", provinciaId: "santa-fe" },
  { nombre: "Santo Tomé", provinciaId: "santa-fe" },
  { nombre: "Venado Tuerto", provinciaId: "santa-fe" },
  { nombre: "Villa Constitución", provinciaId: "santa-fe" },

  // ─── Santiago del Estero ───
  { nombre: "Frías", provinciaId: "santiago-del-estero" },
  { nombre: "La Banda", provinciaId: "santiago-del-estero" },
  { nombre: "Loreto", provinciaId: "santiago-del-estero" },
  { nombre: "Añatuya", provinciaId: "santiago-del-estero" },
  { nombre: "Santiago del Estero", provinciaId: "santiago-del-estero" },
  { nombre: "Termas de Río Hondo", provinciaId: "santiago-del-estero" },

  // ─── Tierra del Fuego ───
  { nombre: "Río Grande", provinciaId: "tierra-del-fuego" },
  { nombre: "Tolhuin", provinciaId: "tierra-del-fuego" },
  { nombre: "Ushuaia", provinciaId: "tierra-del-fuego" },

  // ─── Tucumán ───
  { nombre: "Aguilares", provinciaId: "tucuman" },
  { nombre: "Banda del Río Salí", provinciaId: "tucuman" },
  { nombre: "Concepción", provinciaId: "tucuman" },
  { nombre: "Famaillá", provinciaId: "tucuman" },
  { nombre: "Monteros", provinciaId: "tucuman" },
  { nombre: "San Miguel de Tucumán", provinciaId: "tucuman" },
  { nombre: "Tafí Viejo", provinciaId: "tucuman" },
  { nombre: "Yerba Buena", provinciaId: "tucuman" },
];

// Retorna los municipios de una provincia ordenados alfabéticamente.
export function getMunicipiosByProvincia(provinciaId: string): string[] {
  return MUNICIPIOS.filter((m) => m.provinciaId === provinciaId)
    .map((m) => m.nombre)
    .sort((a, b) => a.localeCompare(b, "es"));
}

// ─────────────────────────────────────────────────────────────────────────────
// Localidades por municipio/partido
// Nota: Para CABA no se definen localidades (los barrios cumplen ese rol).
// Para partidos sin datos definidos, el componente cae al input libre.
// ─────────────────────────────────────────────────────────────────────────────

export type Localidad = {
  nombre: string;
  municipioNombre: string;
  provinciaId: string;
};

export const LOCALIDADES: Localidad[] = [
  // ─── Buenos Aires — GBA Norte ───
  { nombre: "Olivos",         municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Florida",        municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Florida Oeste",  municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Munro",          municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Villa Martelli", municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Carapachay",     municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "La Lucila",      municipioNombre: "Vicente López", provinciaId: "buenos-aires" },
  { nombre: "Vicente López",  municipioNombre: "Vicente López", provinciaId: "buenos-aires" },

  { nombre: "San Isidro",    municipioNombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "Martínez",      municipioNombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "Acassuso",      municipioNombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "Béccar",        municipioNombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "Villa Adelina", municipioNombre: "San Isidro", provinciaId: "buenos-aires" },
  { nombre: "La Horqueta",   municipioNombre: "San Isidro", provinciaId: "buenos-aires" },

  { nombre: "San Fernando", municipioNombre: "San Fernando", provinciaId: "buenos-aires" },
  { nombre: "Victoria",     municipioNombre: "San Fernando", provinciaId: "buenos-aires" },
  { nombre: "Virreyes",     municipioNombre: "San Fernando", provinciaId: "buenos-aires" },
  { nombre: "El Talar",     municipioNombre: "San Fernando", provinciaId: "buenos-aires" },

  { nombre: "Tigre",                  municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Don Torcuato",           municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "General Pacheco",        municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Benavídez",              municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Ricardo Rojas",          municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "El Talar de Pacheco",    municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Nordelta",               municipioNombre: "Tigre", provinciaId: "buenos-aires" },
  { nombre: "Rincón de Milberg",      municipioNombre: "Tigre", provinciaId: "buenos-aires" },

  { nombre: "Escobar",              municipioNombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Belén de Escobar",     municipioNombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Garín",                municipioNombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Ingeniero Maschwitz",  municipioNombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Maquinista Savio",     municipioNombre: "Escobar", provinciaId: "buenos-aires" },
  { nombre: "Loma Verde",           municipioNombre: "Escobar", provinciaId: "buenos-aires" },

  { nombre: "Pilar",              municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Del Viso",           municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Manuel Alberti",     municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Fátima",             municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Presidente Derqui",  municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Villa Rosa",         municipioNombre: "Pilar", provinciaId: "buenos-aires" },
  { nombre: "Manzanares",         municipioNombre: "Pilar", provinciaId: "buenos-aires" },

  { nombre: "Los Polvorines",      municipioNombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },
  { nombre: "Grand Bourg",         municipioNombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },
  { nombre: "Tortuguitas",         municipioNombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },
  { nombre: "Pablo Nogués",        municipioNombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },
  { nombre: "Malvinas Argentinas", municipioNombre: "Malvinas Argentinas", provinciaId: "buenos-aires" },

  { nombre: "José C. Paz",  municipioNombre: "José C. Paz", provinciaId: "buenos-aires" },
  { nombre: "Villa Godoy",  municipioNombre: "José C. Paz", provinciaId: "buenos-aires" },
  { nombre: "Los Perales",  municipioNombre: "José C. Paz", provinciaId: "buenos-aires" },

  { nombre: "San Miguel",  municipioNombre: "San Miguel", provinciaId: "buenos-aires" },
  { nombre: "Bella Vista", municipioNombre: "San Miguel", provinciaId: "buenos-aires" },
  { nombre: "Muñiz",       municipioNombre: "San Miguel", provinciaId: "buenos-aires" },
  { nombre: "Mogotes",     municipioNombre: "San Miguel", provinciaId: "buenos-aires" },

  { nombre: "General San Martín", municipioNombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "Villa Ballester",    municipioNombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "Villa Lynch",        municipioNombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "José León Suárez",   municipioNombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "Billinghurst",       municipioNombre: "General San Martín", provinciaId: "buenos-aires" },
  { nombre: "Loma Hermosa",       municipioNombre: "General San Martín", provinciaId: "buenos-aires" },

  { nombre: "Tres de Febrero", municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "Caseros",         municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "El Palomar",      municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "Ciudadela",       municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "Loma Hermosa",    municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },
  { nombre: "Villa del Parque",municipioNombre: "Tres de Febrero", provinciaId: "buenos-aires" },

  // ─── Buenos Aires — GBA Oeste ───
  { nombre: "Morón",          municipioNombre: "Morón", provinciaId: "buenos-aires" },
  { nombre: "Haedo",          municipioNombre: "Morón", provinciaId: "buenos-aires" },
  { nombre: "Castelar",       municipioNombre: "Morón", provinciaId: "buenos-aires" },
  { nombre: "Villa Sarmiento",municipioNombre: "Morón", provinciaId: "buenos-aires" },

  { nombre: "Ituzaingó",       municipioNombre: "Ituzaingó", provinciaId: "buenos-aires" },
  { nombre: "Ituzaingó Norte", municipioNombre: "Ituzaingó", provinciaId: "buenos-aires" },
  { nombre: "Villa Udaondo",   municipioNombre: "Ituzaingó", provinciaId: "buenos-aires" },

  { nombre: "Hurlingham",   municipioNombre: "Hurlingham", provinciaId: "buenos-aires" },
  { nombre: "Villa Tesei",  municipioNombre: "Hurlingham", provinciaId: "buenos-aires" },
  { nombre: "William Morris",municipioNombre: "Hurlingham", provinciaId: "buenos-aires" },

  { nombre: "San Justo",             municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Ramos Mejía",           municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Ciudadela",             municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Isidro Casanova",       municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "González Catán",        municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Lomas del Mirador",     municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Tapiales",              municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Villa Madero",          municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "La Tablada",            municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Aldo Bonzi",            municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Villa Luzuriaga",       municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Rafael Castillo",       municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Gregorio de Laferrère", municipioNombre: "La Matanza", provinciaId: "buenos-aires" },
  { nombre: "Ciudad Evita",          municipioNombre: "La Matanza", provinciaId: "buenos-aires" },

  { nombre: "Merlo",              municipioNombre: "Merlo", provinciaId: "buenos-aires" },
  { nombre: "San Antonio de Padua",municipioNombre: "Merlo", provinciaId: "buenos-aires" },
  { nombre: "Mariano Acosta",     municipioNombre: "Merlo", provinciaId: "buenos-aires" },
  { nombre: "Pontevedra",         municipioNombre: "Merlo", provinciaId: "buenos-aires" },
  { nombre: "Libertad",           municipioNombre: "Merlo", provinciaId: "buenos-aires" },

  { nombre: "Moreno",            municipioNombre: "Moreno", provinciaId: "buenos-aires" },
  { nombre: "Francisco Álvarez", municipioNombre: "Moreno", provinciaId: "buenos-aires" },
  { nombre: "Cuartel V",         municipioNombre: "Moreno", provinciaId: "buenos-aires" },
  { nombre: "La Reja",           municipioNombre: "Moreno", provinciaId: "buenos-aires" },
  { nombre: "Trujui",            municipioNombre: "Moreno", provinciaId: "buenos-aires" },

  { nombre: "Luján",       municipioNombre: "Luján", provinciaId: "buenos-aires" },
  { nombre: "Open Door",   municipioNombre: "Luján", provinciaId: "buenos-aires" },
  { nombre: "Carlos Keen", municipioNombre: "Luján", provinciaId: "buenos-aires" },

  { nombre: "General Rodríguez", municipioNombre: "General Rodríguez", provinciaId: "buenos-aires" },
  { nombre: "Las Praderas",      municipioNombre: "General Rodríguez", provinciaId: "buenos-aires" },

  { nombre: "Marcos Paz", municipioNombre: "Marcos Paz", provinciaId: "buenos-aires" },

  // ─── Buenos Aires — GBA Sur ───
  { nombre: "Lanús",               municipioNombre: "Lanús", provinciaId: "buenos-aires" },
  { nombre: "Lanús Oeste",         municipioNombre: "Lanús", provinciaId: "buenos-aires" },
  { nombre: "Remedios de Escalada",municipioNombre: "Lanús", provinciaId: "buenos-aires" },
  { nombre: "Monte Chingolo",      municipioNombre: "Lanús", provinciaId: "buenos-aires" },
  { nombre: "Valentín Alsina",     municipioNombre: "Lanús", provinciaId: "buenos-aires" },

  { nombre: "Lomas de Zamora",  municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Banfield",         municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Temperley",        municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Turdera",          municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Ingeniero Budge",  municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },
  { nombre: "Lavallol",         municipioNombre: "Lomas de Zamora", provinciaId: "buenos-aires" },

  { nombre: "Quilmes",      municipioNombre: "Quilmes", provinciaId: "buenos-aires" },
  { nombre: "Bernal",       municipioNombre: "Quilmes", provinciaId: "buenos-aires" },
  { nombre: "Ezpeleta",     municipioNombre: "Quilmes", provinciaId: "buenos-aires" },
  { nombre: "Quilmes Oeste",municipioNombre: "Quilmes", provinciaId: "buenos-aires" },
  { nombre: "Don Bosco",    municipioNombre: "Quilmes", provinciaId: "buenos-aires" },

  { nombre: "Berazategui",        municipioNombre: "Berazategui", provinciaId: "buenos-aires" },
  { nombre: "Hudson",             municipioNombre: "Berazategui", provinciaId: "buenos-aires" },
  { nombre: "Plátanos",           municipioNombre: "Berazategui", provinciaId: "buenos-aires" },
  { nombre: "Juan María Gutiérrez",municipioNombre: "Berazategui", provinciaId: "buenos-aires" },
  { nombre: "El Pato",            municipioNombre: "Berazategui", provinciaId: "buenos-aires" },

  { nombre: "Florencio Varela",     municipioNombre: "Florencio Varela", provinciaId: "buenos-aires" },
  { nombre: "Bosques",              municipioNombre: "Florencio Varela", provinciaId: "buenos-aires" },
  { nombre: "Ingeniero Juan Allan", municipioNombre: "Florencio Varela", provinciaId: "buenos-aires" },
  { nombre: "Villa Brown",          municipioNombre: "Florencio Varela", provinciaId: "buenos-aires" },

  { nombre: "Adrogué",       municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Burzaco",       municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Claypole",      municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Don Orione",    municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Glew",          municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Longchamps",    municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "Rafael Calzada",municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },
  { nombre: "San José",      municipioNombre: "Almirante Brown", provinciaId: "buenos-aires" },

  { nombre: "Monte Grande", municipioNombre: "Esteban Echeverría", provinciaId: "buenos-aires" },
  { nombre: "El Jagüel",    municipioNombre: "Esteban Echeverría", provinciaId: "buenos-aires" },
  { nombre: "Luis Guillón", municipioNombre: "Esteban Echeverría", provinciaId: "buenos-aires" },
  { nombre: "9 de Abril",   municipioNombre: "Esteban Echeverría", provinciaId: "buenos-aires" },

  { nombre: "Ezeiza",        municipioNombre: "Ezeiza", provinciaId: "buenos-aires" },
  { nombre: "Canning",       municipioNombre: "Ezeiza", provinciaId: "buenos-aires" },
  { nombre: "Tristán Suárez",municipioNombre: "Ezeiza", provinciaId: "buenos-aires" },
  { nombre: "La Unión",      municipioNombre: "Ezeiza", provinciaId: "buenos-aires" },

  { nombre: "Avellaneda",    municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Dock Sud",      municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Gerli",         municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Sarandí",       municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Villa Domínico",municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },
  { nombre: "Wilde",         municipioNombre: "Avellaneda", provinciaId: "buenos-aires" },

  { nombre: "Presidente Perón",municipioNombre: "Presidente Perón", provinciaId: "buenos-aires" },
  { nombre: "San Vicente",     municipioNombre: "Presidente Perón", provinciaId: "buenos-aires" },

  // ─── Buenos Aires — Gran La Plata ───
  { nombre: "La Plata",        municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "City Bell",       municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Los Hornos",      municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Gonnet",          municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Melchor Romero",  municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Villa Elisa",     municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Tolosa",          municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Villa Elvira",    municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Ringuelet",       municipioNombre: "La Plata", provinciaId: "buenos-aires" },
  { nombre: "Arturo Seguí",    municipioNombre: "La Plata", provinciaId: "buenos-aires" },

  { nombre: "Berisso",  municipioNombre: "Berisso",  provinciaId: "buenos-aires" },
  { nombre: "Ensenada", municipioNombre: "Ensenada", provinciaId: "buenos-aires" },

  // ─── Buenos Aires — Interior (ciudades principales) ───
  { nombre: "Mar del Plata",        municipioNombre: "General Pueyrredón", provinciaId: "buenos-aires" },
  { nombre: "Batán",                municipioNombre: "General Pueyrredón", provinciaId: "buenos-aires" },
  { nombre: "Sierra de los Padres", municipioNombre: "General Pueyrredón", provinciaId: "buenos-aires" },

  { nombre: "Bahía Blanca",       municipioNombre: "Bahía Blanca", provinciaId: "buenos-aires" },
  { nombre: "General Daniel Cerri",municipioNombre: "Bahía Blanca", provinciaId: "buenos-aires" },
  { nombre: "Ingeniero White",    municipioNombre: "Bahía Blanca", provinciaId: "buenos-aires" },

  { nombre: "Tandil",   municipioNombre: "Tandil",   provinciaId: "buenos-aires" },
  { nombre: "Junín",    municipioNombre: "Junín",    provinciaId: "buenos-aires" },
  { nombre: "Pergamino",municipioNombre: "Pergamino",provinciaId: "buenos-aires" },
  { nombre: "Chivilcoy",municipioNombre: "Chivilcoy",provinciaId: "buenos-aires" },
  { nombre: "Olavarría",municipioNombre: "Olavarría",provinciaId: "buenos-aires" },
  { nombre: "Campana",  municipioNombre: "Campana",  provinciaId: "buenos-aires" },
  { nombre: "Zárate",   municipioNombre: "Zárate",   provinciaId: "buenos-aires" },
  { nombre: "Necochea", municipioNombre: "Necochea", provinciaId: "buenos-aires" },
  { nombre: "Azul",     municipioNombre: "Azul",     provinciaId: "buenos-aires" },
  { nombre: "Quilmes",  municipioNombre: "Quilmes",  provinciaId: "buenos-aires" },

  { nombre: "Mar del Tuyú",  municipioNombre: "La Costa", provinciaId: "buenos-aires" },
  { nombre: "San Bernardo",  municipioNombre: "La Costa", provinciaId: "buenos-aires" },
  { nombre: "Santa Teresita",municipioNombre: "La Costa", provinciaId: "buenos-aires" },
  { nombre: "Las Toninas",   municipioNombre: "La Costa", provinciaId: "buenos-aires" },
  { nombre: "Costa del Este",municipioNombre: "La Costa", provinciaId: "buenos-aires" },

  { nombre: "Pinamar",        municipioNombre: "Pinamar", provinciaId: "buenos-aires" },
  { nombre: "Ostende",        municipioNombre: "Pinamar", provinciaId: "buenos-aires" },
  { nombre: "Valeria del Mar",municipioNombre: "Pinamar", provinciaId: "buenos-aires" },
  { nombre: "Carilo",         municipioNombre: "Pinamar", provinciaId: "buenos-aires" },

  // ─── Córdoba ───
  { nombre: "Córdoba",        municipioNombre: "Córdoba",          provinciaId: "cordoba" },
  { nombre: "Alta Gracia",    municipioNombre: "Alta Gracia",      provinciaId: "cordoba" },
  { nombre: "Villa Carlos Paz",municipioNombre: "Villa Carlos Paz",provinciaId: "cordoba" },
  { nombre: "Río Cuarto",     municipioNombre: "Río Cuarto",       provinciaId: "cordoba" },
  { nombre: "San Francisco",  municipioNombre: "San Francisco",    provinciaId: "cordoba" },
  { nombre: "Villa María",    municipioNombre: "Villa María",      provinciaId: "cordoba" },
  { nombre: "Río Tercero",    municipioNombre: "Río Tercero",      provinciaId: "cordoba" },
  { nombre: "Bell Ville",     municipioNombre: "Bell Ville",       provinciaId: "cordoba" },
  { nombre: "Marcos Juárez",  municipioNombre: "Marcos Juárez",    provinciaId: "cordoba" },
  { nombre: "Jesús María",    municipioNombre: "Jesús María",      provinciaId: "cordoba" },
  { nombre: "La Falda",       municipioNombre: "La Falda",         provinciaId: "cordoba" },

  // ─── Santa Fe ───
  { nombre: "Rosario",           municipioNombre: "Rosario",           provinciaId: "santa-fe" },
  { nombre: "Santa Fe",          municipioNombre: "Santa Fe",          provinciaId: "santa-fe" },
  { nombre: "Rafaela",           municipioNombre: "Rafaela",           provinciaId: "santa-fe" },
  { nombre: "Reconquista",       municipioNombre: "Reconquista",       provinciaId: "santa-fe" },
  { nombre: "Venado Tuerto",     municipioNombre: "Venado Tuerto",     provinciaId: "santa-fe" },
  { nombre: "Villa Constitución",municipioNombre: "Villa Constitución",provinciaId: "santa-fe" },
  { nombre: "Santo Tomé",        municipioNombre: "Santo Tomé",        provinciaId: "santa-fe" },

  // ─── Mendoza ───
  { nombre: "Mendoza",     municipioNombre: "Mendoza",     provinciaId: "mendoza" },
  { nombre: "Godoy Cruz",  municipioNombre: "Godoy Cruz",  provinciaId: "mendoza" },
  { nombre: "Guaymallén",  municipioNombre: "Guaymallén",  provinciaId: "mendoza" },
  { nombre: "Las Heras",   municipioNombre: "Las Heras",   provinciaId: "mendoza" },
  { nombre: "Maipú",       municipioNombre: "Maipú",       provinciaId: "mendoza" },
  { nombre: "Luján de Cuyo",municipioNombre: "Luján de Cuyo",provinciaId: "mendoza" },
  { nombre: "San Rafael",  municipioNombre: "San Rafael",  provinciaId: "mendoza" },

  // ─── Tucumán ───
  { nombre: "San Miguel de Tucumán",municipioNombre: "San Miguel de Tucumán",provinciaId: "tucuman" },
  { nombre: "Tafí Viejo",           municipioNombre: "Tafí Viejo",          provinciaId: "tucuman" },
  { nombre: "Yerba Buena",          municipioNombre: "Yerba Buena",         provinciaId: "tucuman" },
  { nombre: "Concepción",           municipioNombre: "Concepción",          provinciaId: "tucuman" },
  { nombre: "Monteros",             municipioNombre: "Monteros",            provinciaId: "tucuman" },
  { nombre: "Banda del Río Salí",   municipioNombre: "Banda del Río Salí",  provinciaId: "tucuman" },

  // ─── Salta ───
  { nombre: "Salta",    municipioNombre: "Salta",    provinciaId: "salta" },
  { nombre: "Orán",     municipioNombre: "Orán",     provinciaId: "salta" },
  { nombre: "Tartagal", municipioNombre: "Tartagal", provinciaId: "salta" },
  { nombre: "Cafayate", municipioNombre: "Cafayate", provinciaId: "salta" },

  // ─── Jujuy ───
  { nombre: "San Salvador de Jujuy",municipioNombre: "San Salvador de Jujuy",provinciaId: "jujuy" },
  { nombre: "Palpalá",              municipioNombre: "Palpalá",              provinciaId: "jujuy" },
  { nombre: "San Pedro de Jujuy",   municipioNombre: "San Pedro de Jujuy",   provinciaId: "jujuy" },

  // ─── Entre Ríos ───
  { nombre: "Paraná",         municipioNombre: "Paraná",         provinciaId: "entre-rios" },
  { nombre: "Gualeguaychú",   municipioNombre: "Gualeguaychú",   provinciaId: "entre-rios" },
  { nombre: "Concordia",      municipioNombre: "Concordia",      provinciaId: "entre-rios" },
  { nombre: "Concepción del Uruguay",municipioNombre: "Concepción del Uruguay",provinciaId: "entre-rios" },

  // ─── Chaco ───
  { nombre: "Resistencia",municipioNombre: "Resistencia",provinciaId: "chaco" },

  // ─── Corrientes ───
  { nombre: "Corrientes",municipioNombre: "Corrientes",provinciaId: "corrientes" },
  { nombre: "Goya",      municipioNombre: "Goya",      provinciaId: "corrientes" },

  // ─── Misiones ───
  { nombre: "Posadas",     municipioNombre: "Posadas",     provinciaId: "misiones" },
  { nombre: "Puerto Iguazú",municipioNombre: "Puerto Iguazú",provinciaId: "misiones" },
  { nombre: "Oberá",       municipioNombre: "Oberá",       provinciaId: "misiones" },
  { nombre: "Eldorado",    municipioNombre: "Eldorado",    provinciaId: "misiones" },

  // ─── Neuquén ───
  { nombre: "Neuquén",               municipioNombre: "Neuquén",               provinciaId: "neuquen" },
  { nombre: "San Martín de los Andes",municipioNombre: "San Martín de los Andes",provinciaId: "neuquen" },
  { nombre: "Villa La Angostura",    municipioNombre: "Villa La Angostura",    provinciaId: "neuquen" },

  // ─── Río Negro ───
  { nombre: "Bariloche",  municipioNombre: "Bariloche",  provinciaId: "rio-negro" },
  { nombre: "Viedma",     municipioNombre: "Viedma",     provinciaId: "rio-negro" },
  { nombre: "Cipolletti", municipioNombre: "Cipolletti", provinciaId: "rio-negro" },
  { nombre: "El Bolsón",  municipioNombre: "El Bolsón",  provinciaId: "rio-negro" },

  // ─── Chubut ───
  { nombre: "Comodoro Rivadavia",municipioNombre: "Comodoro Rivadavia",provinciaId: "chubut" },
  { nombre: "Trelew",             municipioNombre: "Trelew",             provinciaId: "chubut" },
  { nombre: "Puerto Madryn",      municipioNombre: "Puerto Madryn",      provinciaId: "chubut" },
  { nombre: "Rawson",             municipioNombre: "Rawson",             provinciaId: "chubut" },
  { nombre: "Esquel",             municipioNombre: "Esquel",             provinciaId: "chubut" },

  // ─── La Pampa ───
  { nombre: "Santa Rosa",  municipioNombre: "Santa Rosa",  provinciaId: "la-pampa" },
  { nombre: "General Pico",municipioNombre: "General Pico",provinciaId: "la-pampa" },

  // ─── San Juan ───
  { nombre: "San Juan", municipioNombre: "San Juan", provinciaId: "san-juan" },
  { nombre: "Chimbas",  municipioNombre: "Chimbas",  provinciaId: "san-juan" },
  { nombre: "Rawson",   municipioNombre: "Rawson",   provinciaId: "san-juan" },

  // ─── San Luis ───
  { nombre: "San Luis",      municipioNombre: "San Luis",      provinciaId: "san-luis" },
  { nombre: "Villa Mercedes",municipioNombre: "Villa Mercedes",provinciaId: "san-luis" },

  // ─── Santiago del Estero ───
  { nombre: "Santiago del Estero",municipioNombre: "Santiago del Estero",provinciaId: "santiago-del-estero" },
  { nombre: "La Banda",           municipioNombre: "La Banda",           provinciaId: "santiago-del-estero" },
  { nombre: "Termas de Río Hondo",municipioNombre: "Termas de Río Hondo",provinciaId: "santiago-del-estero" },

  // ─── Tierra del Fuego ───
  { nombre: "Ushuaia",   municipioNombre: "Ushuaia",   provinciaId: "tierra-del-fuego" },
  { nombre: "Río Grande",municipioNombre: "Río Grande",provinciaId: "tierra-del-fuego" },
];

// Retorna las localidades de un municipio ordenadas alfabéticamente.
export function getLocalidadesByMunicipio(provinciaId: string, municipioNombre: string): string[] {
  return LOCALIDADES
    .filter((l) => l.provinciaId === provinciaId && l.municipioNombre === municipioNombre)
    .map((l) => l.nombre)
    .sort((a, b) => a.localeCompare(b, "es"));
}
