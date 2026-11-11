📱 Conecta+ — Monitoramento e Previsão da Qualidade de Conexão

Projeto Interdisciplinar — Centro Universitário Braz Cubas — Semestre 2026/2
Integração Curricular: Programação para Dispositivos Móveis • Análise e Projeto de Sistemas II • Redes de Computadores
Docentes Responsáveis: Profa. Aline dos Santos, Prof. Davi de Oliveira Cruz e Profa. Denise Braito

📝 1. Visão Geral do Projeto

O Conecta+ é um aplicativo móvel desenvolvido com o objetivo de facilitar o acompanhamento da qualidade da conexão com a internet, permitindo que os usuários consultem informações sobre o desempenho da rede e obtenham previsões de estabilidade para diferentes horários do dia.

A aplicação utiliza uma interface intuitiva e acessível, transformando informações técnicas de conectividade em indicadores visuais de fácil compreensão, classificados em três níveis: Boa, Regular e Instável.

Para o funcionamento das funcionalidades de previsão, utilizamos a Internet Quality API, disponibilizada para o desenvolvimento do projeto e hospedada na plataforma Render. A comunicação acontece por meio de requisições HTTP, permitindo consultar modelos preditivos, previsões por localização e informações sobre a qualidade da conexão.

O aplicativo foi desenvolvido utilizando React Native e Expo, proporcionando compatibilidade com dispositivos móveis e permitindo sua execução por meio do Expo Go.

O projeto tem como público principal estudantes, profissionais que trabalham remotamente e pessoas que dependem de uma conexão estável para realizar atividades como videoconferências, streaming, jogos online, navegação e transferência de arquivos.

A proposta está alinhada ao ODS 9 (Indústria, Inovação e Infraestrutura) da ONU, incentivando o acesso à informação tecnológica e contribuindo para uma utilização mais consciente dos recursos de conectividade.

⚙️ 2. Funcionalidades da Interface Mobile

O aplicativo foi organizado em nove telas principais, cada uma desenvolvida para facilitar a consulta e a compreensão das informações disponibilizadas pelo sistema.

Tela Inicial (Home): Apresenta uma visão geral da conexão, mostrando sua classificação atual e informações como latência, velocidade de download e upload. Também disponibiliza um resumo das previsões para os próximos horários.

Seleção de Horário e Período: Permite que o usuário escolha um horário específico ou um período do dia para consultar a qualidade prevista da conexão, facilitando o planejamento de atividades online.

Detalhes da Previsão: Exibe informações detalhadas sobre a qualidade estimada da rede, incluindo latência, download e upload, além de recomendações sobre as atividades que podem ser realizadas naquele horário.

Previsão por Atividade: Permite verificar a adequação da conexão para diferentes atividades, como videoconferências, streaming, jogos online, navegação e envio de arquivos, apresentando uma classificação individual para cada uma.

Histórico de Conexão: Apresenta um gráfico com o comportamento da qualidade da rede ao longo dos últimos dias, acompanhado de indicadores percentuais dos períodos classificados como bons, regulares e instáveis.

Configurações: Reúne as opções de personalização do aplicativo e permite acessar os recursos de notificações, acessibilidade e informações sobre o sistema.

Acessibilidade: Disponibiliza recursos como ajuste de tamanho da fonte, alto contraste, leitor de tela, navegação simplificada, descrição de ícones e linguagem simples.

Glossário e Ajuda: Apresenta explicações simplificadas sobre conceitos técnicos de redes, como latência, jitter e perda de pacotes, facilitando a compreensão dos indicadores apresentados.

Demonstração das telas

Tela de Previsão e Tela de Atividades:

<img width="738" height="1600" alt="image" src="https://github.com/user-attachments/assets/8538b60c-6bcf-4f59-951e-b40946e86a35" />
<img width="738" height="1600" alt="image" src="https://github.com/user-attachments/assets/62157ff2-bf73-4f06-b01f-b837628a23a3" />

🔌 3. Integração com a API

O Conecta+ utiliza a Internet Quality API, hospedada na plataforma Render, como fonte de informações para as funcionalidades de previsão da qualidade da conexão.

A integração é realizada por meio de uma camada de serviços responsável pela comunicação com a API REST, utilizando requisições HTTP para consultar e enviar informações.

Endereço principal da API:

https://internet-quality-api.onrender.com/api/v1

Endpoints utilizados

Método

Endpoint

Finalidade

GET

/models

Consulta os modelos preditivos disponíveis (A, B, C e D).

GET

/forecasts/nearby

Consulta a previsão utilizando a sonda mais próxima por geolocalização.

GET

/forecasts/probes/{id}/timeline

Obtém a previsão horária da sonda para um período de 24 horas.

POST

/activity/check

Verifica a adequação da conexão para atividades e horários específicos.

GET

/health

Consulta a integridade e disponibilidade do servidor.

GET

/locations

Consulta a lista de sondas públicas cadastradas.

Os cinco primeiros endpoints indicados como consumidos fazem parte da integração descrita no contrato da API. O endpoint /locations está mapeado, mas sua utilização efetiva não está confirmada na documentação disponível.

Funcionamento da integração

A aplicação permite selecionar um modelo preditivo e um ponto de referência, consultar previsões de conectividade e apresentar os resultados de maneira organizada nas telas do aplicativo.

Quando a URL da API está configurada, o sistema utiliza os dados retornados pelo serviço. Caso contrário, funciona em modo demonstração, utilizando informações de exemplo previamente definidas no projeto, identificadas na interface como dados demonstrativos.

Em caso de falha na comunicação com a API, o aplicativo apresenta mensagens de erro compreensíveis, sem substituir silenciosamente os resultados por informações fictícias.

🖧 4. Conceitos de Redes de Computadores

O projeto utiliza conceitos fundamentais de redes de computadores para apresentar informações sobre o desempenho e a estabilidade da conexão.

Latência (RTT): Representa o tempo necessário para que os dados sejam enviados até um destino e retornem à origem, sendo expressa em milissegundos (ms).

Perda de Pacotes: Indica a porcentagem de pacotes de dados que não chegam corretamente ao destino, podendo provocar interrupções e instabilidade na comunicação.

Jitter: Representa a variação do tempo de chegada dos pacotes de dados, podendo prejudicar a sincronização de áudio e vídeo em comunicações em tempo real.

Download: Representa a velocidade de recebimento de dados pela conexão.

Upload: Representa a velocidade de envio de dados pela conexão.

Qualidade de Serviço e Experiência do Usuário

O sistema relaciona os conceitos de QoS (Quality of Service) e QoE (Quality of Experience), transformando informações técnicas sobre a rede em classificações compreensíveis para o usuário.

A qualidade é apresentada em três categorias:

Boa: Conexão com condições favoráveis de utilização.

Regular: Conexão que pode apresentar limitações ou oscilações.

Instável: Conexão que pode comprometer determinadas atividades online.

Dessa maneira, o aplicativo ajuda o usuário a compreender as condições previstas da rede antes de realizar atividades que dependem de estabilidade.

♿ 5. Acessibilidade e Experiência do Usuário

O desenvolvimento do Conecta+ considera a acessibilidade como parte importante da experiência de utilização.

Entre os recursos disponíveis estão:

Ajuste do tamanho da fonte.

Opção de alto contraste.

Compatibilidade com leitor de tela.

Navegação simplificada.

Descrição de ícones.

Linguagem simples para explicações técnicas.

Identificação dos estados da conexão por textos e ícones, não dependendo exclusivamente das cores.

O aplicativo também apresenta mensagens amigáveis em situações de falha na comunicação com o servidor, permitindo que o usuário compreenda o problema e tente novamente.

🛠️ 6. Tecnologias Utilizadas

Front-end — Aplicativo Mobile

React Native: Framework utilizado para desenvolver a interface e as funcionalidades do aplicativo móvel.

Expo: Plataforma utilizada para facilitar o desenvolvimento, execução e testes do aplicativo.

TypeScript: Linguagem utilizada para adicionar tipagem estática e melhorar a organização e segurança do código.

Expo Router: Responsável pela organização das telas e navegação entre as funcionalidades.

JavaScript: Utilizado no ecossistema e nos serviços de integração.

Feather Icons (@expo/vector-icons): Biblioteca de ícones utilizada na interface.

React Native SVG: Utilizado para a construção de elementos gráficos, incluindo representações do histórico de conexão.

AsyncStorage: Responsável pelo armazenamento local de preferências e configurações do usuário.

Back-end e Integração

FastAPI / Python: Tecnologia utilizada na Internet Quality API hospedada na nuvem.

API REST: Padrão de comunicação utilizado para realizar as consultas e enviar informações entre o aplicativo e o servidor.

Render: Plataforma de hospedagem da API.

Tecnologias Complementares

Java 17: Utilizado no projeto complementar de back-end da disciplina de Análise e Projeto de Sistemas II.

Spring Boot 3.4.0: Framework utilizado na estruturação da aplicação Java.

JUnit 5: Ferramenta utilizada para testes automatizados.

JaCoCo: Ferramenta utilizada para análise da cobertura dos testes.

🚀 7. Como Executar o Projeto

Para executar o Conecta+, é necessário ter o Node.js instalado no computador e o aplicativo Expo Go no celular, caso queira testar diretamente em um dispositivo móvel.

Pré-requisitos

Node.js 20 ou superior.

npm.

Expo Go instalado no Android ou iOS.

Computador e celular conectados à mesma rede Wi-Fi, quando utilizado o modo de conexão local.

Passo a passo para execução

1. Instalação das dependências

Abra o terminal na pasta principal do projeto e execute:

npm install

Esse comando instala todas as bibliotecas necessárias para o funcionamento do aplicativo.

2. Configuração da API

Configure a variável de ambiente EXPO_PUBLIC_API_URL no arquivo .env, utilizando o endereço:

EXPO_PUBLIC_API_URL=https://internet-quality-api.onrender.com/api/v1

Essa configuração permite que o aplicativo utilize a API real. Sem ela, o sistema inicia em modo demonstração, com dados de exemplo.

3. Inicialização do aplicativo

Execute o comando:

npx expo start -c

O Expo iniciará o servidor de desenvolvimento e disponibilizará um QR Code no terminal.

4. Acesso pelo celular

Instale e abra o aplicativo Expo Go.

Escaneie o QR Code apresentado no terminal.

Aguarde o carregamento do aplicativo no dispositivo.

5. Execução pelo navegador (opcional)

Para executar o aplicativo no navegador, utilize:

npx expo start --web

Testes e verificações

O projeto também disponibiliza comandos para verificar seu funcionamento:

npm test

Executa os testes automatizados utilizando Jest.

npm run typecheck

Verifica os tipos e a integridade do código TypeScript.

📁 8. Estrutura do Projeto

A aplicação está organizada em diretórios responsáveis por separar as funcionalidades e facilitar a manutenção do código.

conecta-mais/
├── app/
│   └── Telas e rotas do aplicativo
│
├── src/
│   ├── domain/       # Regras de qualidade e atividades
│   ├── services/     # Comunicação com a API
│   ├── state/        # Estados e preferências
│   ├── components/   # Componentes da interface
│   └── theme/        # Cores e estilos
│
├── assets/           # Imagens e recursos visuais
├── app.json          # Configurações do Expo
├── package.json      # Dependências e scripts
├── tsconfig.json     # Configurações TypeScript
└── README.md         # Documentação do projeto

👥 9. Integrantes do Grupo

Grupo — Projeto Conecta+

Abraão Amorim Diogenes — RGM: 43410243

Igor Augusto Maciel da Rocha — RGM: 42704545

Kevin William Paulino da Costa — RGM: 42923077

Lucas Paulino de Paula Santos — RGM: 42770131

Marcio Aires da Costa Nunes Filho — RGM: 43715770

🎯 10. Considerações Finais

O desenvolvimento do Conecta+ possibilitou a aplicação prática dos conhecimentos adquiridos nas disciplinas de Programação para Dispositivos Móveis, Análise e Projeto de Sistemas II e Redes de Computadores.

Por meio da integração com uma API externa, da utilização de tecnologias modernas e da construção de uma interface acessível, o projeto busca simplificar o acompanhamento da qualidade da conexão com a internet.

A proposta é oferecer ao usuário informações organizadas e previsões que auxiliem no planejamento de suas atividades digitais, tornando os conceitos de redes mais compreensíveis e aproximando a tecnologia das necessidades do cotidiano.
