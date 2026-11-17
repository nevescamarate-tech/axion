// Configuração do Axion.
// Sem estes valores a app funciona na mesma, mas só neste telemóvel e sem avisos com a app fechada.
// Preenche com os dados do teu projeto Supabase (ver LEIA-ME.md, passo 2).
window.AXION_CONFIG = {
  supabaseUrl: "",       // ex.: "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",   // chave "anon public" do projeto
  vapidPublicKey: "BN96gqGViNm0GLr5qf1pss3YOGWTOAMmzPRIKxxwOn5ZUnrldCVmD8o1yUX_MZGyfPmvwKS-fCWgGoZQ6kPsbl4",
  // PINs de acesso (guardados cifrados). Para tirar o acesso a alguém, apaga a linha do PIN dele.
  pinSalt: "axion-nbt-2026",
  pins: [
    "87bb9f1ab2fec7116bc232379a665b2d82660c0c652a097b19494f748d34cf00",  // PIN 1
    "fa2a362fddf48c4021dfeabd5a5b3ede3a8c1f391aa56dbba0655ebfa8a3dc9b",  // PIN 2
    "c97c27daaf0f5237dbe0c703bf4b2b52246f296259f2051ec264ec7ee8d1ac47",  // PIN 3
    "5c7d1d05b9d729c9a22ffc5c9f9cadd9510448da181ae15e8a025969c98e7e42",  // PIN 4
    "018c4e147c6ba2a17e71ded371486c2770c2e529b3a312a405bf083fdd960d94",  // PIN 5
    "2954b23db97875d734cd779885c5b022c39ef33f0e9ce247ae93a1562faeaf66"   // PIN 6
  ]
};
