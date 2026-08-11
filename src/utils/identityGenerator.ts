/**
 * CODEX(R) System — Identity & Billing Data Generator
 *
 * Generates realistic random billing identity datasets per country.
 * If any identity field is left blank, this utility seamlessly fills in valid,
 * country-tailored values (Name, Email, Phone, Address, City, State, Zip).
 */

import type { IdentitySettings } from '../types/checkout';

interface CountryIdentityData {
  firstNames: string[];
  lastNames: string[];
  streetNames: string[];
  cities: { name: string; state: string; zipPattern: string }[];
  phoneFormat: string; // e.g. "305555####" or "6########"
}

// ─── Country Databases ────────────────────────────────────────────────────────

const COUNTRY_DATA: Record<string, CountryIdentityData> = {
  // United States
  US: {
    firstNames: ['James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'],
    streetNames: ['Evergreen Terrace', 'Main Street', 'Oak Avenue', 'Maple Drive', 'Washington Boulevard', 'Park Street', 'Cedar Lane', 'Elm Street', 'Pine Street', 'Broadway'],
    cities: [
      { name: 'New York', state: 'NY', zipPattern: '100##' },
      { name: 'Los Angeles', state: 'CA', zipPattern: '900##' },
      { name: 'Chicago', state: 'IL', zipPattern: '606##' },
      { name: 'Houston', state: 'TX', zipPattern: '770##' },
      { name: 'Miami', state: 'FL', zipPattern: '331##' },
      { name: 'Phoenix', state: 'AZ', zipPattern: '850##' },
      { name: 'Philadelphia', state: 'PA', zipPattern: '191##' },
      { name: 'San Antonio', state: 'TX', zipPattern: '782##' },
    ],
    phoneFormat: '305555####',
  },

  // España
  ES: {
    firstNames: ['Carlos', 'Alejandro', 'Javier', 'David', 'Daniel', 'Manuel', 'Pablo', 'Álvaro', 'Hugo', 'Adrián', 'Lucía', 'María', 'Paula', 'Sara', 'Laura', 'Carmen', 'Marta', 'Alba', 'Elena', 'Ana'],
    lastNames: ['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Navarro', 'Torres'],
    streetNames: ['Calle Mayor', 'Gran Vía', 'Calle de Alcalá', 'Paseo de la Castellana', 'Avenida de la Constitución', 'Calle Real', 'Paseo de Gracia', 'Calle Balmes'],
    cities: [
      { name: 'Madrid', state: 'Madrid', zipPattern: '280##' },
      { name: 'Barcelona', state: 'Barcelona', zipPattern: '080##' },
      { name: 'Valencia', state: 'Valencia', zipPattern: '460##' },
      { name: 'Sevilla', state: 'Sevilla', zipPattern: '410##' },
      { name: 'Zaragoza', state: 'Zaragoza', zipPattern: '500##' },
      { name: 'Málaga', state: 'Málaga', zipPattern: '290##' },
    ],
    phoneFormat: '6########',
  },

  // México
  MX: {
    firstNames: ['Mateo', 'Santiago', 'Sebastián', 'Leonardo', 'Matías', 'Emiliano', 'Diego', 'Daniel', 'Alexander', 'Fernando', 'Sofia', 'Valentina', 'Regina', 'Camila', 'María José', 'Ximena', 'Victoria', 'Renata', 'Natalia', 'Daniela'],
    lastNames: ['Hernández', 'García', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vásquez', 'Reyes', 'Jiménez', 'Torres', 'Díaz', 'Gutiérrez', 'Mendoza'],
    streetNames: ['Av. Insurgentes Sur', 'Paseo de la Reforma', 'Av. Benito Juárez', 'Calle Hidalgo', 'Av. Revolución', 'Calle 5 de Mayo', 'Av. Cuauhtémoc', 'Av. Universidad'],
    cities: [
      { name: 'Ciudad de México', state: 'CDMX', zipPattern: '010##' },
      { name: 'Guadalajara', state: 'Jalisco', zipPattern: '441##' },
      { name: 'Monterrey', state: 'Nuevo León', zipPattern: '640##' },
      { name: 'Puebla', state: 'Puebla', zipPattern: '720##' },
      { name: 'Querétaro', state: 'Querétaro', zipPattern: '760##' },
      { name: 'Mérida', state: 'Yucatán', zipPattern: '970##' },
    ],
    phoneFormat: '55#######',
  },

  // Colombia
  CO: {
    firstNames: ['Santiago', 'Samuel', 'Jerónimo', 'Thiago', 'Matías', 'Nicolás', 'Maximiliano', 'Juan José', 'Emmanuel', 'Lucas', 'Mariana', 'Salomé', 'Isabella', 'Luciana', 'Gabriela', 'Antonella', 'Sofía', 'Samantha', 'Valeria', 'Guadalupe'],
    lastNames: ['Rodríguez', 'Gómez', 'González', 'Martínez', 'García', 'López', 'Hernández', 'Sánchez', 'Pérez', 'Ramírez', 'Díaz', 'Muñoz', 'Rojas', 'Moreno', 'Ortiz', 'Jiménez', 'Castro', 'Vargas', 'Álvarez', 'Torres'],
    streetNames: ['Carrera 7', 'Calle 100', 'Av. El Dorado', 'Carrera 15', 'Calle 26', 'Av. Suba', 'Carrera 50', 'Calle 72'],
    cities: [
      { name: 'Bogotá', state: 'Cundinamarca', zipPattern: '1101##' },
      { name: 'Medellín', state: 'Antioquia', zipPattern: '0500##' },
      { name: 'Cali', state: 'Valle del Cauca', zipPattern: '7600##' },
      { name: 'Barranquilla', state: 'Atlántico', zipPattern: '0800##' },
      { name: 'Cartagena', state: 'Bolívar', zipPattern: '1300##' },
    ],
    phoneFormat: '300######',
  },

  // Perú
  PE: {
    firstNames: ['Luis', 'Carlos', 'Jorge', 'Jose', 'Juan', 'Cesar', 'Victor', 'Manuel', 'Jesús', 'Miguel', 'Maria', 'Rosa', 'Carmen', 'Ana', 'Luz', 'Juana', 'Flor', 'Milagros', 'Elizabeth', 'Patricia'],
    lastNames: ['Quispe', 'Flores', 'Sánchez', 'García', 'Rojas', 'Díaz', 'YUPANQUI', 'Huamán', 'Mendoza', 'Mamani', 'Chávez', 'Ramos', 'Torres', 'Vásquez', 'Castro', 'Romero', 'López', 'Gonzales', 'Pérez', 'Fernández'],
    streetNames: ['Av. Arequipa', 'Av. Javier Prado', 'Av. Larco', 'Av. Abancay', 'Av. Petit Thouars', 'Av. Universitaria', 'Av. Brasil', 'Av. Colonial'],
    cities: [
      { name: 'Lima', state: 'Lima', zipPattern: '150##' },
      { name: 'Arequipa', state: 'Arequipa', zipPattern: '040##' },
      { name: 'Trujillo', state: 'La Libertad', zipPattern: '130##' },
      { name: 'Cusco', state: 'Cusco', zipPattern: '080##' },
      { name: 'Piura', state: 'Piura', zipPattern: '200##' },
    ],
    phoneFormat: '9########',
  },

  // Argentina
  AR: {
    firstNames: ['Joaquín', 'Bautista', 'Felipe', 'Mateo', 'Benjamín', 'Santino', 'Tomás', 'Ciro', 'Thiago', 'Lautaro', 'Martina', 'Catalina', 'Emma', 'Delfina', 'Olivia', 'Josefina', 'Renata', 'Juana', 'Victoria', 'Sofía'],
    lastNames: ['González', 'Rodríguez', 'Gómez', 'Fernández', 'López', 'Díaz', 'Martínez', 'Pérez', 'García', 'Sánchez', 'Romero', 'Sosa', 'Álvarez', 'Torres', 'Ruiz', 'Ramírez', 'Flores', 'Benítez', 'Acosta', 'Medina'],
    streetNames: ['Av. Corrientes', 'Av. 9 de Julio', 'Av. Santa Fe', 'Av. Cabildo', 'Av. Rivadavia', 'Calle Florida', 'Av. Belgrano', 'Av. de Mayo'],
    cities: [
      { name: 'Buenos Aires', state: 'CABA', zipPattern: 'C104#' },
      { name: 'Córdoba', state: 'Córdoba', zipPattern: 'X500#' },
      { name: 'Rosario', state: 'Santa Fe', zipPattern: 'S200#' },
      { name: 'Mendoza', state: 'Mendoza', zipPattern: 'M550#' },
      { name: 'La Plata', state: 'Buenos Aires', zipPattern: 'B190#' },
    ],
    phoneFormat: '11########',
  },

  // Chile
  CL: {
    firstNames: ['Mateo', 'Gaspar', 'Santiago', 'Lucas', 'Benjamín', 'Agustín', 'Vicente', 'Maximilian', 'Tomás', 'Joaquín', 'Sofia', 'Emma', 'Isidora', 'Florencia', 'Maite', 'Emilia', 'Mia', 'Antonella', 'Amanda', 'Trinidad'],
    lastNames: ['González', 'Muñoz', 'Rojas', 'Díaz', 'Pérez', 'Soto', 'Contreras', 'Silva', 'Martínez', 'Sepúlveda', 'Morales', 'Rodríguez', 'López', 'Fuentes', 'Hernández', 'Torres', 'Araya', 'Flores', 'Espinoza', 'Valenzuela'],
    streetNames: ['Av. Providencia', 'Av. Apoquindo', 'Av. Alameda', 'Av. Las Condes', 'Calle Ahumada', 'Av. Vicuña Mackenna', 'Av. Italia', 'Calle Huérfanos'],
    cities: [
      { name: 'Santiago', state: 'Región Metropolitana', zipPattern: '8320###' },
      { name: 'Valparaíso', state: 'Valparaíso', zipPattern: '2340###' },
      { name: 'Concepción', state: 'Bío Bío', zipPattern: '4030###' },
      { name: 'Viña del Mar', state: 'Valparaíso', zipPattern: '2520###' },
    ],
    phoneFormat: '9########',
  },

  // Brasil
  BR: {
    firstNames: ['Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Guilherme', 'Gustavo', 'Felipe', 'Rafael', 'Enzo', 'Nicolas', 'Sophia', 'Alice', 'Julia', 'Isabella', 'Manuela', 'Laura', 'Luiza', 'Giovanna', 'Beatriz', 'Maria Eduarda'],
    lastNames: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soyza', 'Fernandes', 'Vasconcelos', 'Barbosa'],
    streetNames: ['Avenida Paulista', 'Rua Augusta', 'Avenida Copacabana', 'Rua Oscar Freire', 'Avenida Brasil', 'Rua das Flores', 'Avenida Beira Mar'],
    cities: [
      { name: 'São Paulo', state: 'SP', zipPattern: '0100#-###' },
      { name: 'Rio de Janeiro', state: 'RJ', zipPattern: '2000#-###' },
      { name: 'Belo Horizonte', state: 'MG', zipPattern: '3000#-###' },
      { name: 'Curitiba', state: 'PR', zipPattern: '8000#-###' },
      { name: 'Porto Alegre', state: 'RS', zipPattern: '9000#-###' },
    ],
    phoneFormat: '119########',
  },

  // France
  FR: {
    firstNames: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Jules', 'Maël', 'Lucas', 'Adam', 'Hugo', 'Jade', 'Louise', 'Emma', 'Alice', 'Ambre', 'Lina', 'Rose', 'Chloé', 'Mia', 'Léa'],
    lastNames: ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard'],
    streetNames: ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Haussmann', 'Rue de Rivoli', 'Rue Saint-Honoré', 'Avenue Victor Hugo', 'Boulevard Saint-Germain'],
    cities: [
      { name: 'Paris', state: 'Île-de-France', zipPattern: '750##' },
      { name: 'Lyon', state: 'Auvergne-Rhône-Alpes', zipPattern: '690##' },
      { name: 'Marseille', state: 'Provence-Alpes-Côte d\'Azur', zipPattern: '130##' },
      { name: 'Toulouse', state: 'Occitanie', zipPattern: '310##' },
      { name: 'Nice', state: 'Provence-Alpes-Côte d\'Azur', zipPattern: '060##' },
    ],
    phoneFormat: '6########',
  },

  // Germany
  DE: {
    firstNames: ['Noah', 'Matteo', 'Leon', 'Finn', 'Paul', 'Elias', 'Emil', 'Luca', 'Louis', 'Felix', 'Mia', 'Emma', 'Sophia', 'Hannah', 'Emilia', 'Lina', 'Ella', 'Mila', 'Clara', 'Marie'],
    lastNames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann'],
    streetNames: ['Hauptstraße', 'Bahnhofstraße', 'Schulstraße', 'Gartenstraße', 'Dorfstraße', 'Bergstraße', 'Goethestraße', 'Schillerstraße'],
    cities: [
      { name: 'Berlin', state: 'Berlin', zipPattern: '101##' },
      { name: 'München', state: 'Bayern', zipPattern: '803##' },
      { name: 'Hamburg', state: 'Hamburg', zipPattern: '200##' },
      { name: 'Frankfurt am Main', state: 'Hessen', zipPattern: '603##' },
      { name: 'Köln', state: 'Nordrhein-Westfalen', zipPattern: '506##' },
    ],
    phoneFormat: '151#######',
  },

  // United Kingdom
  GB: {
    firstNames: ['Oliver', 'George', 'Arthur', 'Noah', 'Muhammad', 'Leo', 'Harry', 'Oscar', 'Archie', 'Henry', 'Olivia', 'Amelia', 'Isla', 'Ava', 'Mia', 'Ivy', 'Lily', 'Isabella', 'Sophia', 'Grace'],
    lastNames: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright', 'Thompson', 'Evans', 'Walker', 'White', 'Roberts', 'Green', 'Hall', 'Wood', 'Jackson', 'Clarke'],
    streetNames: ['High Street', 'Station Road', 'Main Street', 'London Road', 'Church Lane', 'Victoria Road', 'Green Lane', 'Park Road'],
    cities: [
      { name: 'London', state: 'Greater London', zipPattern: 'EC1A 1##' },
      { name: 'Manchester', state: 'Greater Manchester', zipPattern: 'M1 1##' },
      { name: 'Birmingham', state: 'West Midlands', zipPattern: 'B1 1##' },
      { name: 'Edinburgh', state: 'Scotland', zipPattern: 'EH1 1##' },
      { name: 'Glasgow', state: 'Scotland', zipPattern: 'G1 1##' },
    ],
    phoneFormat: '7700######',
  },

  // Canada
  CA: {
    firstNames: ['Liam', 'Noah', 'Jackson', 'Lucas', 'Logan', 'Benjamin', 'Jacob', 'William', 'Oliver', 'James', 'Olivia', 'Emma', 'Charlotte', 'Sophia', 'Aria', 'Ava', 'Chloe', 'Zoe', 'Amelia', 'Hannah'],
    lastNames: ['Smith', 'Brown', 'Tremblay', 'Martin', 'Roy', 'Wilson', 'Macdonald', 'Johnson', 'Taylor', 'Campbell', 'Anderson', 'Jones', 'Miller', 'Gagnon', 'Lee', 'White', 'Bernier', 'Richard', 'Williams', 'Bouchard'],
    streetNames: ['Yonge Street', 'Queen Street', 'King Street', 'Bloor Street', 'Jasper Avenue', 'Robson Street', 'Main Street', 'Ste-Catherine Street'],
    cities: [
      { name: 'Toronto', state: 'ON', zipPattern: 'M5V 2##' },
      { name: 'Montreal', state: 'QC', zipPattern: 'H3B 1##' },
      { name: 'Vancouver', state: 'BC', zipPattern: 'V6B 1##' },
      { name: 'Calgary', state: 'AB', zipPattern: 'T2P 1##' },
      { name: 'Ottawa', state: 'ON', zipPattern: 'K1P 1##' },
    ],
    phoneFormat: '416555####',
  },

  // Italy
  IT: {
    firstNames: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Riccardo', 'Tommaso', 'Edoardo', 'Sofia', 'Giulia', 'Aurora', 'Alice', 'Ginevra', 'Emma', 'Giorgia', 'Greta', 'Beatrice', 'Anna'],
    lastNames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'],
    streetNames: ['Via Roma', 'Corso Vittorio Emanuele', 'Via Dante', 'Via Garibaldi', 'Corso Buenos Aires', 'Via Nazionale', 'Via del Corso'],
    cities: [
      { name: 'Roma', state: 'Lazio', zipPattern: '001##' },
      { name: 'Milano', state: 'Lombardia', zipPattern: '201##' },
      { name: 'Napoli', state: 'Campania', zipPattern: '801##' },
      { name: 'Torino', state: 'Piemonte', zipPattern: '101##' },
      { name: 'Firenze', state: 'Toscana', zipPattern: '501##' },
    ],
    phoneFormat: '339#######',
  },

  // Australia
  AU: {
    firstNames: ['Oliver', 'Noah', 'William', 'Jack', 'Leo', 'Henry', 'Charlie', 'Thomas', 'Lucas', 'Archie', 'Charlotte', 'Amelia', 'Isla', 'Olivia', 'Mia', 'Grace', 'Willow', 'Harper', 'Chloe', 'Ella'],
    lastNames: ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson', 'Thompson', 'Nguyen', 'Thomas', 'Walker', 'Harris', 'Lee', 'Ryan', 'Robinson', 'Kelly', 'King'],
    streetNames: ['George Street', 'Bourke Street', 'Collins Street', 'Pitt Street', 'Flinders Street', 'Queen Street', 'Swanston Street'],
    cities: [
      { name: 'Sydney', state: 'NSW', zipPattern: '200#' },
      { name: 'Melbourne', state: 'VIC', zipPattern: '300#' },
      { name: 'Brisbane', state: 'QLD', zipPattern: '400#' },
      { name: 'Perth', state: 'WA', zipPattern: '600#' },
      { name: 'Adelaide', state: 'SA', zipPattern: '500#' },
    ],
    phoneFormat: '412######',
  },
};

export const COUNTRIES_WITH_FLAGS = [
  { code: 'US', name: 'United States', flag: '🇺🇸', label: '🇺🇸 Estados Unidos (United States)' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', label: '🇪🇸 España' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', label: '🇲🇽 México' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', label: '🇨🇴 Colombia' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', label: '🇵🇪 Perú' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', label: '🇦🇷 Argentina' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', label: '🇨🇱 Chile' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', label: '🇧🇷 Brasil' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', label: '🇨🇦 Canadá' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', label: '🇬🇧 Reino Unido' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', label: '🇩🇪 Alemania' },
  { code: 'FR', name: 'France', flag: '🇫🇷', label: '🇫🇷 Francia' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', label: '🇮🇹 Italia' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', label: '🇦🇺 Australia' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', label: '🇦🇫 Afganistán' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', label: '🇦🇱 Albania' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', label: '🇩🇿 Argelia' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', label: '🇦🇩 Andorra' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', label: '🇦🇴 Angola' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', label: '🇦🇬 Antigua y Barbuda' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', label: '🇦🇲 Armenia' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', label: '🇦🇹 Austria' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', label: '🇦🇿 Azerbaiyán' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', label: '🇧🇸 Bahamas' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', label: '🇧🇭 Bahréin' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', label: '🇧🇩 Bangladés' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', label: '🇧🇧 Barbados' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', label: '🇧🇾 Bielorrusia' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', label: '🇧🇪 Bélgica' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', label: '🇧🇿 Belice' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯', label: '🇧🇯 Benín' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', label: '🇧🇴 Bolivia' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', label: '🇧🇦 Bosnia y Herzegovina' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', label: '🇧🇼 Botsuana' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', label: '🇧🇳 Brunéi' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', label: '🇧🇬 Bulgaria' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', label: '🇧🇫 Burkina Faso' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮', label: '🇧🇮 Burundi' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', label: '🇰🇭 Camboya' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', label: '🇨🇲 Camerún' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', label: '🇨🇻 Cabo Verde' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', label: '🇨🇫 República Centroafricana' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩', label: '🇹🇩 Chad' },
  { code: 'CN', name: 'China', flag: '🇨🇳', label: '🇨🇳 China' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', label: '🇨🇷 Costa Rica' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', label: '🇭🇷 Croacia' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', label: '🇨🇺 Cuba' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', label: '🇨🇾 Chipre' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', label: '🇨🇿 República Checa' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', label: '🇩🇰 Dinamarca' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', label: '🇩🇯 Yibuti' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲', label: '🇩🇲 Dominica' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', label: '🇩🇴 República Dominicana' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', label: '🇪🇨 Ecuador' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', label: '🇪🇬 Egipto' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', label: '🇸🇻 El Salvador' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', label: '🇬🇶 Guinea Ecuatorial' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷', label: '🇪🇷 Eritrea' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', label: '🇪🇪 Estonia' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', label: '🇪🇹 Etiopía' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', label: '🇫🇯 Fiyi' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', label: '🇫🇮 Finlandia' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦', label: '🇬🇦 Gabón' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲', label: '🇬🇲 Gambia' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', label: '🇬🇪 Georgia' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', label: '🇬🇭 Ghana' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', label: '🇬🇷 Grecia' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩', label: '🇬🇩 Granada' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', label: '🇬🇹 Guatemala' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳', label: '🇬🇳 Guinea' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', label: '🇬🇼 Guinea-Bisáu' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', label: '🇬🇾 Guyana' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', label: '🇭🇹 Haití' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', label: '🇭🇳 Honduras' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', label: '🇭🇺 Hungría' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', label: '🇮🇸 Islandia' },
  { code: 'IN', name: 'India', flag: '🇮🇳', label: '🇮🇳 India' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', label: '🇮🇩 Indonesia' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', label: '🇮🇷 Irán' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', label: '🇮🇶 Irak' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', label: '🇮🇪 Irlanda' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', label: '🇮🇱 Israel' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', label: '🇯🇲 Jamaica' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', label: '🇯🇵 Japón' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', label: '🇯🇴 Jordania' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', label: '🇰🇿 Kazajistán' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', label: '🇰🇪 Kenia' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', label: '🇰🇮 Kiribati' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵', label: '🇰🇵 Corea del Norte' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', label: '🇰🇷 Corea del Sur' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', label: '🇰🇼 Kuwait' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', label: '🇰🇬 Kirguistán' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', label: '🇱🇦 Laos' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', label: '🇱🇻 Letonia' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', label: '🇱🇧 Líbano' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸', label: '🇱🇸 Lesoto' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷', label: '🇱🇷 Liberia' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', label: '🇱🇾 Libia' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', label: '🇱🇮 Liechtenstein' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', label: '🇱🇹 Lituania' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', label: '🇱🇺 Luxemburgo' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', label: '🇲🇬 Madagascar' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', label: '🇲🇼 Malaui' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', label: '🇲🇾 Malasia' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', label: '🇲🇻 Maldivas' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', label: '🇲🇱 Malí' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', label: '🇲🇹 Malta' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', label: '🇲🇭 Islas Marshall' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷', label: '🇲🇷 Mauritania' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', label: '🇲🇺 Mauricio' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', label: '🇫🇲 Micronesia' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', label: '🇲🇩 Moldavia' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', label: '🇲🇨 Mónaco' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', label: '🇲🇳 Mongolia' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', label: '🇲🇪 Montenegro' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', label: '🇲🇦 Marruecos' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', label: '🇲🇿 Mozambique' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', label: '🇲🇲 Birmania' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', label: '🇳🇦 Namibia' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', label: '🇳🇷 Nauru' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', label: '🇳🇵 Nepal' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', label: '🇳🇱 Países Bajos' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', label: '🇳🇿 Nueva Zelanda' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', label: '🇳🇮 Nicaragua' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪', label: '🇳🇪 Níger' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', label: '🇳🇬 Nigeria' },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', label: '🇲🇰 Macedonia del Norte' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', label: '🇳🇴 Noruega' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', label: '🇴🇲 Omán' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', label: '🇵🇰 Pakistán' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', label: '🇵🇼 Palaos' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', label: '🇵🇦 Panamá' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', label: '🇵🇬 Papúa Nueva Guinea' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', label: '🇵🇾 Paraguay' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', label: '🇵🇭 Filipinas' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', label: '🇵🇱 Polonia' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', label: '🇵🇹 Portugal' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', label: '🇶🇦 Catar' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', label: '🇷🇴 Rumanía' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', label: '🇷🇺 Rusia' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', label: '🇷🇼 Ruanda' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳', label: '🇰🇳 San Cristóbal y Nieves' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨', label: '🇱🇨 Santa Lucía' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', label: '🇻🇨 San Vicente y las Granadinas' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', label: '🇼🇸 Samoa' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', label: '🇸🇲 San Marino' },
  { code: 'ST', name: 'Sao Tome and Principe', flag: '🇸🇹', label: '🇸🇹 Santo Tomé y Príncipe' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', label: '🇸🇦 Arabia Saudita' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', label: '🇸🇳 Senegal' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', label: '🇷🇸 Serbia' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', label: '🇸🇨 Seychelles' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', label: '🇸🇱 Sierra Leona' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', label: '🇸🇬 Singapur' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', label: '🇸🇰 Eslovaquia' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', label: '🇸🇮 Eslovenia' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', label: '🇸🇧 Islas Salomón' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴', label: '🇸🇴 Somalia' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', label: '🇿🇦 Sudáfrica' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸', label: '🇸🇸 Sudán del Sur' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', label: '🇱🇰 Sri Lanka' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩', label: '🇸🇩 Sudán' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', label: '🇸🇷 Surinam' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', label: '🇸🇪 Suecia' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', label: '🇨🇭 Suiza' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', label: '🇸🇾 Siria' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', label: '🇹🇼 Taiwán' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', label: '🇹🇯 Tayikistán' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', label: '🇹🇿 Tanzania' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', label: '🇹🇭 Tailandia' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱', label: '🇹🇱 Timor Oriental' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬', label: '🇹🇬 Togo' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', label: '🇹🇴 Tonga' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', label: '🇹🇹 Trinidad y Tobago' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', label: '🇹🇳 Túnez' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', label: '🇹🇷 Turquía' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', label: '🇹🇲 Turkmenistán' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', label: '🇹🇻 Tuvalu' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', label: '🇺🇬 Uganda' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', label: '🇺🇦 Ucrania' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', label: '🇦🇪 Emiratos Árabes Unidos' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', label: '🇺🇾 Uruguay' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', label: '🇺🇿 Uzbekistán' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', label: '🇻🇺 Vanuatu' },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', label: '🇻🇦 Ciudad del Vaticano' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', label: '🇻🇪 Venezuela' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', label: '🇻🇳 Vietnam' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', label: '🇾🇪 Yemen' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', label: '🇿🇲 Zambia' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', label: '🇿🇼 Zimbabue' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDigits(count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function resolvePattern(pattern: string): string {
  return pattern.replace(/#/g, () => Math.floor(Math.random() * 10).toString());
}

/**
 * Normalizes a country string into a 2-letter ISO code lookup key.
 */
function normalizeCountryCode(country: string): string {
  if (!country) return 'US';
  const c = country.trim().toUpperCase();

  if (c === 'US' || c.includes('UNITED STATES') || c.includes('ESTADOS UNIDOS') || c.includes('USA')) return 'US';
  if (c === 'ES' || c.includes('ESPAÑA') || c.includes('SPAIN')) return 'ES';
  if (c === 'MX' || c.includes('MÉXICO') || c.includes('MEXICO')) return 'MX';
  if (c === 'CO' || c.includes('COLOMBIA')) return 'CO';
  if (c === 'PE' || c.includes('PERÚ') || c.includes('PERU')) return 'PE';
  if (c === 'AR' || c.includes('ARGENTINA')) return 'AR';
  if (c === 'CL' || c.includes('CHILE')) return 'CL';
  if (c === 'BR' || c.includes('BRASIL') || c.includes('BRAZIL')) return 'BR';
  if (c === 'CA' || c.includes('CANADÁ') || c.includes('CANADA')) return 'CA';
  if (c === 'FR' || c.includes('FRANCIA') || c.includes('FRANCE')) return 'FR';
  if (c === 'DE' || c.includes('ALEMANIA') || c.includes('GERMANY')) return 'DE';
  if (c === 'IT' || c.includes('ITALIA') || c.includes('ITALY')) return 'IT';
  if (c === 'AU' || c.includes('AUSTRALIA')) return 'AU';
  if (c === 'GB' || c.includes('REINO UNIDO') || c.includes('UNITED KINGDOM') || c.includes('UK')) return 'GB';

  return 'US'; // Default fallback
}

// ─── Main Exported Generator ──────────────────────────────────────────────────

/**
 * Generates a full random identity for a given country.
 */
export function generateRandomIdentity(countryInput: string): IdentitySettings {
  const code = normalizeCountryCode(countryInput);
  const data = COUNTRY_DATA[code] || COUNTRY_DATA.US;

  const firstName = randomItem(data.firstNames);
  const lastName = randomItem(data.lastNames);
  const billingName = `${firstName} ${lastName}`;

  // Clean email address matching the name
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com'];
  const email = `${cleanFirst}.${cleanLast}${randomDigits(3)}@${randomItem(domains)}`;

  const streetNumber = Math.floor(Math.random() * 899) + 100;
  const streetName = randomItem(data.streetNames);
  const address1 = `${streetNumber} ${streetName}`;
  const address2 = Math.random() > 0.6 ? `Apt ${Math.floor(Math.random() * 40) + 1}B` : '';

  const cityObj = randomItem(data.cities);
  const city = cityObj.name;
  const state = cityObj.state;
  const zipCode = resolvePattern(cityObj.zipPattern);

  const phone = resolvePattern(data.phoneFormat);

  return {
    email,
    billingName,
    phone,
    address1,
    address2,
    city,
    state,
    country: countryInput.trim() || 'United States',
    zipCode,
    delay: 2,
  };
}

/**
 * Fills any blank/empty fields in an existing IdentitySettings object with
 * realistic random values for the target country, ensuring NO blank fields remain.
 */
export function ensureCompleteIdentity(identity: Partial<IdentitySettings>): IdentitySettings {
  const targetCountry = identity.country || 'United States';
  const randomFallback = generateRandomIdentity(targetCountry);

  return {
    billingName: (identity.billingName && identity.billingName.trim()) ? identity.billingName.trim() : randomFallback.billingName,
    email: (identity.email && identity.email.trim()) ? identity.email.trim() : randomFallback.email,
    phone: (identity.phone && identity.phone.trim()) ? identity.phone.trim() : randomFallback.phone,
    address1: (identity.address1 && identity.address1.trim()) ? identity.address1.trim() : randomFallback.address1,
    address2: identity.address2 ? identity.address2.trim() : '',
    city: (identity.city && identity.city.trim()) ? identity.city.trim() : randomFallback.city,
    state: (identity.state && identity.state.trim()) ? identity.state.trim() : randomFallback.state,
    country: targetCountry,
    zipCode: (identity.zipCode && identity.zipCode.trim()) ? identity.zipCode.trim() : randomFallback.zipCode,
    delay: identity.delay ?? 2,
  };
}
