INSERT INTO
    `activity` (`label`)
SELECT
    seed.`label`
FROM (
    SELECT 'Agence ou société commerciale' AS `label`
    UNION ALL
    SELECT 'Agriculture'
    UNION ALL
    SELECT 'Art et design'
    UNION ALL
    SELECT 'Industrie automobile'
    UNION ALL
    SELECT 'Construction'
    UNION ALL
    SELECT 'Biens de consommation'
    UNION ALL
    SELECT 'Éducation'
    UNION ALL
    SELECT 'Ingénierie'
    UNION ALL
    SELECT 'Divertissement'
    UNION ALL
    SELECT 'Services financiers'
    UNION ALL
    SELECT 'Activités de restauration'
    UNION ALL
    SELECT 'Jeux'
    UNION ALL
    SELECT 'Fonction publique'
    UNION ALL
    SELECT 'Services de santé'
    UNION ALL
    SELECT "Décoration d'intérieur"
    UNION ALL
    SELECT 'Interne'
    UNION ALL
    SELECT 'Légal'
    UNION ALL
    SELECT 'Industrie'
    UNION ALL
    SELECT 'Commercialisation'
    UNION ALL
    SELECT 'Exploitation minière et logistique'
    UNION ALL
    SELECT 'Non lucratif'
    UNION ALL
    SELECT 'Publication et médias Web'
    UNION ALL
    SELECT 'Vente au détail (e-commerce et hors ligne)'
    UNION ALL
    SELECT 'Immobilier'
    UNION ALL
    SELECT 'Service'
    UNION ALL
    SELECT 'Technologie'
    UNION ALL
    SELECT 'Télécommunications'
    UNION ALL
    SELECT 'Tourisme / hôtellerie'
    UNION ALL
    SELECT 'Création de sites web'
    UNION ALL
    SELECT 'Développement web'
    UNION ALL
    SELECT 'Maroquinerie'
    UNION ALL
    SELECT 'Pêche maritime'
) AS seed
LEFT JOIN `activity` existing ON existing.`label` = seed.`label`
WHERE existing.`id` IS NULL;

INSERT IGNORE INTO
    `country` (`id`, `alpha2Code`, `alpha3Code`)
VALUES
    (1, 'AF', 'AFG'),
    (2, 'AX', 'ALA'),
    (3, 'AL', 'ALB'),
    (4, 'DZ', 'DZA'),
    (5, 'AS', 'ASM'),
    (6, 'AD', 'AND'),
    (7, 'AO', 'AGO'),
    (8, 'AI', 'AIA'),
    (9, 'AQ', 'ATA'),
    (10, 'AG', 'ATG'),
    (11, 'AR', 'ARG'),
    (12, 'AM', 'ARM'),
    (13, 'AW', 'ABW'),
    (14, 'AU', 'AUS'),
    (15, 'AT', 'AUT'),
    (16, 'AZ', 'AZE'),
    (17, 'BS', 'BHS'),
    (18, 'BH', 'BHR'),
    (19, 'BD', 'BGD'),
    (20, 'BB', 'BRB'),
    (21, 'BY', 'BLR'),
    (22, 'BE', 'BEL'),
    (23, 'BZ', 'BLZ'),
    (24, 'BJ', 'BEN'),
    (25, 'BM', 'BMU'),
    (26, 'BT', 'BTN'),
    (27, 'BO', 'BOL'),
    (28, 'BQ', 'BES'),
    (29, 'BA', 'BIH'),
    (30, 'BW', 'BWA'),
    (31, 'BV', 'BVT'),
    (32, 'BR', 'BRA'),
    (33, 'IO', 'IOT'),
    (34, 'BN', 'BRN'),
    (35, 'BG', 'BGR'),
    (36, 'BF', 'BFA'),
    (37, 'BI', 'BDI'),
    (38, 'CV', 'CPV'),
    (39, 'KH', 'KHM'),
    (40, 'CM', 'CMR'),
    (41, 'CA', 'CAN'),
    (42, 'KY', 'CYM'),
    (43, 'CF', 'CAF'),
    (44, 'TD', 'TCD'),
    (45, 'CL', 'CHL'),
    (46, 'CN', 'CHN'),
    (47, 'CX', 'CXR'),
    (48, 'CC', 'CCK'),
    (49, 'CO', 'COL'),
    (50, 'KM', 'COM'),
    (51, 'CG', 'COG'),
    (52, 'CD', 'COD'),
    (53, 'CK', 'COK'),
    (54, 'CR', 'CRI'),
    (55, 'CI', 'CIV'),
    (56, 'HR', 'HRV'),
    (57, 'CU', 'CUB'),
    (58, 'CW', 'CUW'),
    (59, 'CY', 'CYP'),
    (60, 'CZ', 'CZE'),
    (61, 'DK', 'DNK'),
    (62, 'DJ', 'DJI'),
    (63, 'DM', 'DMA'),
    (64, 'DO', 'DOM'),
    (65, 'EC', 'ECU'),
    (66, 'EG', 'EGY'),
    (67, 'SV', 'SLV'),
    (68, 'GQ', 'GNQ'),
    (69, 'ER', 'ERI'),
    (70, 'EE', 'EST'),
    (71, 'SZ', 'SWZ'),
    (72, 'ET', 'ETH'),
    (73, 'FK', 'FLK'),
    (74, 'FO', 'FRO'),
    (75, 'FJ', 'FJI'),
    (76, 'FI', 'FIN'),
    (77, 'FR', 'FRA'),
    (78, 'GF', 'GUF'),
    (79, 'PF', 'PYF'),
    (80, 'TF', 'ATF'),
    (81, 'GA', 'GAB'),
    (82, 'GM', 'GMB'),
    (83, 'GE', 'GEO'),
    (84, 'DE', 'DEU'),
    (85, 'GH', 'GHA'),
    (86, 'GI', 'GIB'),
    (87, 'GR', 'GRC'),
    (88, 'GL', 'GRL'),
    (89, 'GD', 'GRD'),
    (90, 'GP', 'GLP'),
    (91, 'GU', 'GUM'),
    (92, 'GT', 'GTM'),
    (93, 'GG', 'GGY'),
    (94, 'GN', 'GIN'),
    (95, 'GW', 'GNB'),
    (96, 'GY', 'GUY'),
    (97, 'HT', 'HTI'),
    (98, 'HM', 'HMD'),
    (99, 'VA', 'VAT'),
    (100, 'HN', 'HND'),
    (101, 'HK', 'HKG'),
    (102, 'HU', 'HUN'),
    (103, 'IS', 'ISL'),
    (104, 'IN', 'IND'),
    (105, 'ID', 'IDN'),
    (106, 'IR', 'IRN'),
    (107, 'IQ', 'IRQ'),
    (108, 'IE', 'IRL'),
    (109, 'IM', 'IMN'),
    (110, 'IL', 'ISR'),
    (111, 'IT', 'ITA'),
    (112, 'JM', 'JAM'),
    (113, 'JP', 'JPN'),
    (114, 'JE', 'JEY'),
    (115, 'JO', 'JOR'),
    (116, 'KZ', 'KAZ'),
    (117, 'KE', 'KEN'),
    (118, 'KI', 'KIR'),
    (119, 'KP', 'PRK'),
    (120, 'KR', 'KOR'),
    (121, 'KW', 'KWT'),
    (122, 'KG', 'KGZ'),
    (123, 'LA', 'LAO'),
    (124, 'LV', 'LVA'),
    (125, 'LB', 'LBN'),
    (126, 'LS', 'LSO'),
    (127, 'LR', 'LBR'),
    (128, 'LY', 'LBY'),
    (129, 'LI', 'LIE'),
    (130, 'LT', 'LTU'),
    (131, 'LU', 'LUX'),
    (132, 'MO', 'MAC'),
    (133, 'MG', 'MDG'),
    (134, 'MW', 'MWI'),
    (135, 'MY', 'MYS'),
    (136, 'MV', 'MDV'),
    (137, 'ML', 'MLI'),
    (138, 'MT', 'MLT'),
    (139, 'MH', 'MHL'),
    (140, 'MQ', 'MTQ'),
    (141, 'MR', 'MRT'),
    (142, 'MU', 'MUS'),
    (143, 'YT', 'MYT'),
    (144, 'MX', 'MEX'),
    (145, 'FM', 'FSM'),
    (146, 'MD', 'MDA'),
    (147, 'MC', 'MCO'),
    (148, 'MN', 'MNG'),
    (149, 'ME', 'MNE'),
    (150, 'MS', 'MSR'),
    (151, 'MA', 'MAR'),
    (152, 'MZ', 'MOZ'),
    (153, 'MM', 'MMR'),
    (154, 'NA', 'NAM'),
    (155, 'NR', 'NRU'),
    (156, 'NP', 'NPL'),
    (157, 'NL', 'NLD'),
    (158, 'NC', 'NCL'),
    (159, 'NZ', 'NZL'),
    (160, 'NI', 'NIC'),
    (161, 'NE', 'NER'),
    (162, 'NG', 'NGA'),
    (163, 'NU', 'NIU'),
    (164, 'NF', 'NFK'),
    (165, 'MK', 'MKD'),
    (166, 'MP', 'MNP'),
    (167, 'NO', 'NOR'),
    (168, 'OM', 'OMN'),
    (169, 'PK', 'PAK'),
    (170, 'PW', 'PLW'),
    (171, 'PS', 'PSE'),
    (172, 'PA', 'PAN'),
    (173, 'PG', 'PNG'),
    (174, 'PY', 'PRY'),
    (175, 'PE', 'PER'),
    (176, 'PH', 'PHL'),
    (177, 'PN', 'PCN'),
    (178, 'PL', 'POL'),
    (179, 'PT', 'PRT'),
    (180, 'PR', 'PRI'),
    (181, 'QA', 'QAT'),
    (182, 'RE', 'REU'),
    (183, 'RO', 'ROU'),
    (184, 'RU', 'RUS'),
    (185, 'RW', 'RWA'),
    (186, 'BL', 'BLM'),
    (187, 'SH', 'SHN'),
    (188, 'KN', 'KNA'),
    (189, 'LC', 'LCA'),
    (190, 'MF', 'MAF'),
    (191, 'PM', 'SPM'),
    (192, 'VC', 'VCT'),
    (193, 'WS', 'WSM'),
    (194, 'SM', 'SMR'),
    (195, 'ST', 'STP'),
    (196, 'SA', 'SAU'),
    (197, 'SN', 'SEN'),
    (198, 'RS', 'SRB'),
    (199, 'SC', 'SYC'),
    (200, 'SL', 'SLE'),
    (201, 'SG', 'SGP'),
    (202, 'SX', 'SXM'),
    (203, 'SK', 'SVK'),
    (204, 'SI', 'SVN'),
    (205, 'SB', 'SLB'),
    (206, 'SO', 'SOM'),
    (207, 'ZA', 'ZAF'),
    (208, 'GS', 'SGS'),
    (209, 'SS', 'SSD'),
    (210, 'ES', 'ESP'),
    (211, 'LK', 'LKA'),
    (212, 'SD', 'SDN'),
    (213, 'SR', 'SUR'),
    (214, 'SJ', 'SJM'),
    (215, 'SE', 'SWE'),
    (216, 'CH', 'CHE'),
    (217, 'SY', 'SYR'),
    (218, 'TW', 'TWN'),
    (219, 'TJ', 'TJK'),
    (220, 'TZ', 'TZA'),
    (221, 'TH', 'THA'),
    (222, 'TL', 'TLS'),
    (223, 'TG', 'TGO'),
    (224, 'TK', 'TKL'),
    (225, 'TO', 'TON'),
    (226, 'TT', 'TTO'),
    (227, 'TN', 'TUN'),
    (228, 'TR', 'TUR'),
    (229, 'TM', 'TKM'),
    (230, 'TC', 'TCA'),
    (231, 'TV', 'TUV'),
    (232, 'UG', 'UGA'),
    (233, 'UA', 'UKR'),
    (234, 'AE', 'ARE'),
    (235, 'GB', 'GBR'),
    (236, 'US', 'USA'),
    (237, 'UM', 'UMI'),
    (238, 'UY', 'URY'),
    (239, 'UZ', 'UZB'),
    (240, 'VU', 'VUT'),
    (241, 'VE', 'VEN'),
    (242, 'VN', 'VNM'),
    (243, 'VG', 'VGB'),
    (244, 'VI', 'VIR'),
    (245, 'WF', 'WLF'),
    (246, 'EH', 'ESH'),
    (247, 'YE', 'YEM'),
    (248, 'ZM', 'ZMB'),
    (249, 'ZW', 'ZWE');

INSERT IGNORE INTO
    `currency` (
        `id`,
        `code`,
        `label`,
        `symbol`,
        `digitAfterComma`
    )
VALUES
    (1, 'AFN', 'Afghan afghani', '؋', 2),
    (2, 'ALL', 'Albanian lek', 'L', 2),
    (3, 'DZD', 'Algerian dinar', 'د.ج', 2),
    (4, 'AOA', 'Angolan kwanza', 'Kz', 2),
    (5, 'ARS', 'Argentine peso', '$', 2),
    (6, 'AMD', 'Armenian dram', '֏', 2),
    (7, 'AWG', 'Aruban florin', 'ƒ', 2),
    (8, 'AUD', 'Australian dollar', '$', 2),
    (9, 'AZN', 'Azerbaijani manat', '₼', 2),
    (10, 'BSD', 'Bahamian dollar', '$', 2),
    (11, 'BHD', 'Bahraini dinar', '.د.ب', 2),
    (12, 'BDT', 'Bangladeshi taka', '৳', 2),
    (13, 'BBD', 'Barbadian dollar', '$', 2),
    (14, 'BZD', 'Belize dollar', '$', 2),
    (15, 'BMD', 'Bermudian dollar', '$', 2),
    (16, 'BTN', 'Bhutanese ngultrum', 'Nu.', 2),
    (17, 'BOB', 'Bolivian boliviano', 'Bs.', 2),
    (
        18,
        'BAM',
        'Bosnia and Herzegovina convertible mark',
        'KM',
        2
    ),
    (19, 'BWP', 'Botswana pula', 'P', 2),
    (20, 'BRL', 'Brazilian real', 'R$', 2),
    (21, 'GBP', 'British pound', '£', 2),
    (22, 'BND', 'Brunei dollar', '$', 2),
    (23, 'BGN', 'Bulgarian lev', 'лв', 2),
    (24, 'MMK', 'Burmese kyat', 'Ks', 2),
    (25, 'BIF', 'Burundian franc', 'Fr', 2),
    (26, 'XPF', 'CFP franc', 'Fr', 2),
    (27, 'KHR', 'Cambodian riel', '៛', 2),
    (28, 'CAD', 'Canadian dollar', '$', 2),
    (29, 'CVE', 'Cape Verdean escudo', 'Esc', 2),
    (30, 'KYD', 'Cayman Islands dollar', '$', 2),
    (31, 'XAF', 'Central African CFA franc', 'Fr', 2),
    (32, 'CLP', 'Chilean peso', '$', 2),
    (33, 'CNY', 'Chinese yuan', '¥', 2),
    (34, 'COP', 'Colombian peso', '$', 2),
    (35, 'KMF', 'Comorian franc', 'Fr', 2),
    (36, 'CDF', 'Congolese franc', 'Fr', 2),
    (37, 'CRC', 'Costa Rican colón', '₡', 2),
    (38, 'CUC', 'Cuban convertible peso', '$', 2),
    (39, 'CZK', 'Czech koruna', 'Kč', 2),
    (40, 'DKK', 'Danish krone', 'kr', 2),
    (41, 'DJF', 'Djiboutian franc', 'Fr', 2),
    (42, 'DOP', 'Dominican peso', '$', 2),
    (43, 'XCD', 'East Caribbean dollar', '$', 2),
    (44, 'EGP', 'Egyptian pound', '£', 2),
    (45, 'ERN', 'Eritrean nakfa', 'Nfk', 2),
    (46, 'ETB', 'Ethiopian birr', 'Br', 2),
    (47, 'EUR', 'Euro', '€', 2),
    (48, 'FKP', 'Falkland Islands Pound', '£', 2),
    (49, 'FKP', 'Falkland Islands pound', '£', 2),
    (50, 'FJD', 'Fijian dollar', '$', 2),
    (51, 'GMD', 'Gambian dalasi', 'D', 2),
    (52, 'GEL', 'Georgian Lari', 'ლ', 2),
    (53, 'GHS', 'Ghanaian cedi', '₵', 2),
    (54, 'GIP', 'Gibraltar pound', '£', 2),
    (55, 'GTQ', 'Guatemalan quetzal', 'Q', 2),
    (56, 'GNF', 'Guinean franc', 'Fr', 2),
    (57, 'GYD', 'Guyanese dollar', '$', 2),
    (58, 'HTG', 'Haitian gourde', 'G', 2),
    (59, 'HNL', 'Honduran lempira', 'L', 2),
    (60, 'HKD', 'Hong Kong dollar', '$', 2),
    (61, 'HUF', 'Hungarian forint', 'Ft', 2),
    (62, 'ISK', 'Icelandic króna', 'kr', 2),
    (63, 'INR', 'Indian rupee', '₹', 2),
    (64, 'IDR', 'Indonesian rupiah', 'Rp', 2),
    (65, 'IRR', 'Iranian rial', '﷼', 2),
    (66, 'IQD', 'Iraqi dinar', 'ع.د', 2),
    (67, 'ILS', 'Israeli new shekel', '₪', 2),
    (68, 'JMD', 'Jamaican dollar', '$', 2),
    (69, 'JPY', 'Japanese yen', '¥', 2),
    (70, 'JOD', 'Jordanian dinar', 'د.ا', 2),
    (71, 'KZT', 'Kazakhstani tenge', '₸', 2),
    (72, 'KES', 'Kenyan shilling', 'Sh', 2),
    (73, 'KWD', 'Kuwaiti dinar', 'د.ك', 2),
    (74, 'KGS', 'Kyrgyzstani som', 'с', 2),
    (75, 'LAK', 'Lao kip', '₭', 2),
    (76, 'LBP', 'Lebanese pound', 'ل.ل', 2),
    (77, 'LSL', 'Lesotho loti', 'L', 2),
    (78, 'LRD', 'Liberian dollar', '$', 2),
    (79, 'LYD', 'Libyan dinar', 'ل.د', 2),
    (80, 'MOP', 'Macanese pataca', 'P', 2),
    (81, 'MKD', 'Macedonian denar', 'ден', 2),
    (82, 'MGA', 'Malagasy ariary', 'Ar', 2),
    (83, 'MWK', 'Malawian kwacha', 'MK', 2),
    (84, 'MYR', 'Malaysian ringgit', 'RM', 2),
    (85, 'MVR', 'Maldivian rufiyaa', '.ރ', 2),
    (86, 'MRO', 'Mauritanian ouguiya', 'UM', 2),
    (87, 'MUR', 'Mauritian rupee', '₨', 2),
    (88, 'MXN', 'Mexican peso', '$', 2),
    (89, 'MDL', 'Moldovan leu', 'L', 2),
    (90, 'MNT', 'Mongolian tögrög', '₮', 2),
    (91, 'MAD', 'Moroccan dirham', 'د.م.', 2),
    (92, 'MZN', 'Mozambican metical', 'MT', 2),
    (93, 'NAD', 'Namibian dollar', '$', 2),
    (94, 'NPR', 'Nepalese rupee', '₨', 2),
    (
        95,
        'ANG',
        'Netherlands Antillean guilder',
        'ƒ',
        2
    ),
    (96, 'BYN', 'New Belarusian ruble', 'Br', 2),
    (97, 'TWD', 'New Taiwan dollar', '$', 2),
    (98, 'NZD', 'New Zealand dollar', '$', 2),
    (99, 'NIO', 'Nicaraguan córdoba', 'C$', 2),
    (100, 'NGN', 'Nigerian naira', '₦', 2),
    (101, 'KPW', 'North Korean won', '₩', 2),
    (102, 'NOK', 'Norwegian krone', 'kr', 2),
    (103, 'OMR', 'Omani rial', 'ر.ع.', 2),
    (104, 'PKR', 'Pakistani rupee', '₨', 2),
    (105, 'PAB', 'Panamanian balboa', 'B/.', 2),
    (106, 'PGK', 'Papua New Guinean kina', 'K', 2),
    (107, 'PYG', 'Paraguayan guaraní', '₲', 2),
    (108, 'PEN', 'Peruvian sol', 'S/.', 2),
    (109, 'PHP', 'Philippine peso', '₱', 2),
    (110, 'PLN', 'Polish złoty', 'zł', 2),
    (111, 'QAR', 'Qatari riyal', 'ر.ق', 2),
    (112, 'RON', 'Romanian leu', 'lei', 2),
    (113, 'RUB', 'Russian ruble', '₽', 2),
    (114, 'RWF', 'Rwandan franc', 'Fr', 2),
    (115, 'SHP', 'Saint Helena pound', '£', 2),
    (116, 'WST', 'Samoan tālā', 'T', 2),
    (117, 'SAR', 'Saudi riyal', 'ر.س', 2),
    (118, 'RSD', 'Serbian dinar', 'дин.', 2),
    (119, 'SCR', 'Seychellois rupee', '₨', 2),
    (120, 'SLL', 'Sierra Leonean leone', 'Le', 2),
    (121, 'SGD', 'Singapore dollar', '$', 2),
    (122, 'SBD', 'Solomon Islands dollar', '$', 2),
    (123, 'SOS', 'Somali shilling', 'Sh', 2),
    (124, 'ZAR', 'South African rand', 'R', 2),
    (125, 'KRW', 'South Korean won', '₩', 2),
    (126, 'SSP', 'South Sudanese pound', '£', 2),
    (127, 'LKR', 'Sri Lankan rupee', 'Rs', 2),
    (128, 'SDG', 'Sudanese pound', 'ج.س.', 2),
    (129, 'SRD', 'Suri"label"se dollar', '$', 2),
    (130, 'SZL', 'Swazi lilangeni', 'L', 2),
    (131, 'SEK', 'Swedish krona', 'kr', 2),
    (132, 'CHF', 'Swiss franc', 'Fr', 2),
    (133, 'SYP', 'Syrian pound', '£', 2),
    (
        134,
        'STD',
        'São Tomé and Príncipe dobra',
        'Db',
        2
    ),
    (135, 'TJS', 'Tajikistani somoni', 'ЅМ', 2),
    (136, 'TZS', 'Tanzanian shilling', 'Sh', 2),
    (137, 'THB', 'Thai baht', '฿', 2),
    (138, 'TOP', 'Tongan paʻanga', 'T$', 2),
    (
        139,
        'TTD',
        'Trin"id"ad and Tobago dollar',
        '$',
        2
    ),
    (140, 'TND', 'Tunisian dinar', 'DT', 3),
    (141, 'TRY', 'Turkish lira', '₺', 2),
    (142, 'TMT', 'Turkmenistan manat', 'm', 2),
    (143, 'UGX', 'Ugandan shilling', 'Sh', 2),
    (144, 'UAH', 'Ukrainian hryvnia', '₴', 2),
    (
        145,
        'AED',
        'United Arab Emirates dirham',
        'د.إ',
        2
    ),
    (146, 'USD', 'United States dollar', '$', 2),
    (147, 'UYU', 'Uruguayan peso', '$', 2),
    (148, 'VUV', 'Vanuatu vatu', 'Vt', 2),
    (149, 'VEF', 'Venezuelan bolívar', 'Bs S', 2),
    (150, 'VND', 'Viet"label"se đồng', '₫', 2),
    (151, 'XOF', 'West African CFA franc', 'Fr', 2),
    (152, 'YER', 'Yemeni rial', '﷼', 2),
    (153, 'ZMW', 'Zambian kwacha', 'ZK', 2);

INSERT IGNORE INTO
    `payment_condition` (`id`, `label`, `description`)
VALUES
    (1, 'Payable à réception', ''),
    (2, 'Echéance à la fin du mois', ''),
    (3, 'Echéance à la fin du mois prochain', ''),
    (4, 'Personnalisé', '');

INSERT INTO
    `app_config` (`key`, `value`)
VALUES
    (
        'quotation_sequence',
        '{"label": "quotation", "prefix": "QUO", "dateFormat": "yyyy-MM", "next": 1}'
    ),
    (
        'invoice_sequence',
        '{"label": "invoice", "prefix": "INV", "dateFormat": "yyyy-MM", "next": 1}'
    )
ON DUPLICATE KEY UPDATE
    `key` = `key`;

SET @tax_has_value_column = (
    SELECT COUNT(*)
    FROM `information_schema`.`columns`
    WHERE `table_schema` = DATABASE()
      AND `table_name` = 'tax'
      AND `column_name` = 'value'
);

SET @tax_seed_sql = IF(
    @tax_has_value_column > 0,
    '
    INSERT INTO `tax` (`label`, `value`, `isRate`, `isSpecial`)
    SELECT
        seed.`label`,
        seed.`value`,
        seed.`isRate`,
        seed.`isSpecial`
    FROM (
        SELECT ''FODEC'' AS `label`, 1 AS `value`, TRUE AS `isRate`, TRUE AS `isSpecial`
        UNION ALL
        SELECT ''TVA'', 19, TRUE, FALSE
    ) AS seed
    LEFT JOIN `tax` existing ON existing.`label` = seed.`label`
    WHERE existing.`id` IS NULL
    ',
    '
    INSERT INTO `tax` (`label`, `rate`, `isSpecial`)
    SELECT
        seed.`label`,
        seed.`rate`,
        seed.`isSpecial`
    FROM (
        SELECT ''FODEC'' AS `label`, 0.01 AS `rate`, TRUE AS `isSpecial`
        UNION ALL
        SELECT ''TVA'', 0.19, FALSE
    ) AS seed
    LEFT JOIN `tax` existing ON existing.`label` = seed.`label`
    WHERE existing.`id` IS NULL
    '
);

PREPARE `tax_seed_stmt` FROM @tax_seed_sql;
EXECUTE `tax_seed_stmt`;
DEALLOCATE PREPARE `tax_seed_stmt`;

INSERT INTO
    `address` (
        `address`,
        `address2`,
        `region`,
        `zipcode`,
        `countryId`
    )
SELECT
    seed.`address`,
    seed.`address2`,
    seed.`region`,
    seed.`zipcode`,
    seed.`countryId`
FROM (
    SELECT
        '188 Avenue 14 Janvier' AS `address`,
        'Apt. 855' AS `address2`,
        'Bizerte' AS `region`,
        '7000' AS `zipcode`,
        227 AS `countryId`
) AS seed
LEFT JOIN `address` existing ON existing.`address` <=> seed.`address`
    AND existing.`address2` <=> seed.`address2`
    AND existing.`region` <=> seed.`region`
    AND existing.`zipcode` <=> seed.`zipcode`
    AND existing.`countryId` <=> seed.`countryId`
WHERE existing.`id` IS NULL;

INSERT INTO
    `cabinet` (
        `enterpriseName`,
        `email`,
        `phone`,
        `taxIdNumber`,
        `activityId`,
        `currencyId`,
        `addressId`
    )
SELECT
    seed.`enterpriseName`,
    seed.`email`,
    seed.`phone`,
    seed.`taxIdNumber`,
    seed.`activityId`,
    seed.`currencyId`,
    address_lookup.`id`
FROM (
    SELECT
        'Zedney Creative EMEA' AS `enterpriseName`,
        'contact@zedney.com' AS `email`,
        '+216 72 428 365' AS `phone`,
        '1538414/L/A/M/0000' AS `taxIdNumber`,
        8 AS `activityId`,
        140 AS `currencyId`,
        '188 Avenue 14 Janvier' AS `address`,
        'Apt. 855' AS `address2`,
        'Bizerte' AS `region`,
        '7000' AS `zipcode`,
        227 AS `countryId`
) AS seed
INNER JOIN `address` address_lookup ON address_lookup.`address` <=> seed.`address`
    AND address_lookup.`address2` <=> seed.`address2`
    AND address_lookup.`region` <=> seed.`region`
    AND address_lookup.`zipcode` <=> seed.`zipcode`
    AND address_lookup.`countryId` <=> seed.`countryId`
LEFT JOIN `cabinet` existing ON existing.`taxIdNumber` = seed.`taxIdNumber`
    OR existing.`enterpriseName` = seed.`enterpriseName`
WHERE existing.`id` IS NULL;
