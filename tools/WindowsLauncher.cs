// Windows launcher for the portable demo. No Node.js, installation, administrator
// privileges, network download, registry entry or external service is required.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal sealed class LocalGameServer : IDisposable {
    private readonly string root;
    private readonly TcpListener listener;
    private volatile bool stopping;
    internal string Url { get; private set; }

    internal LocalGameServer(string directory) {
        root = Path.GetFullPath(directory).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
        if (!File.Exists(Path.Combine(root, "index.html")) || !File.Exists(Path.Combine(root, "src", "main.js")))
            throw new FileNotFoundException("Extraia a pasta inteira do ZIP antes de abrir o jogo. O executável deve ficar junto de index.html e das pastas src e config.");
        listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        Url = "http://127.0.0.1:" + ((IPEndPoint)listener.LocalEndpoint).Port + "/";
        Thread accept = new Thread(Accept);
        accept.IsBackground = true;
        accept.Start();
    }
    private void Accept() {
        while (!stopping) {
            try {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(delegate { Handle(client); });
            } catch (SocketException) { if (!stopping) Thread.Sleep(20); }
              catch (ObjectDisposedException) { break; }
        }
    }
    private static string ReadLine(Stream stream) {
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < 8192; i++) {
            int value = stream.ReadByte();
            if (value < 0) throw new IOException("Conexão encerrada.");
            if (value == 10) return result.ToString().TrimEnd('\r');
            result.Append((char)value);
        }
        throw new IOException("Linha HTTP longa demais.");
    }
    private static void Reply(Stream stream, int code, string type, byte[] body, bool head) {
        string reason = code == 200 ? "OK" : code == 403 ? "Forbidden" : code == 404 ? "Not Found" : code == 405 ? "Method Not Allowed" : "Bad Request";
        string header = "HTTP/1.1 " + code + " " + reason + "\r\nContent-Type: " + type +
            "\r\nContent-Length: " + body.Length + "\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
        byte[] bytes = Encoding.ASCII.GetBytes(header);
        stream.Write(bytes, 0, bytes.Length);
        if (!head) stream.Write(body, 0, body.Length);
    }
    private static void Error(Stream stream, int code, bool head) {
        Reply(stream, code, "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Arauto do Sol: " + code), head);
    }
    private void Handle(TcpClient client) {
        using (client) {
            client.ReceiveTimeout = 3000;
            client.SendTimeout = 3000;
            try {
                using (NetworkStream stream = client.GetStream()) {
                    string[] request = ReadLine(stream).Split(' ');
                    if (request.Length != 3) { Error(stream, 400, false); return; }
                    int headerLength = 0;
                    string line;
                    while ((line = ReadLine(stream)).Length > 0) {
                        headerLength += line.Length;
                        if (headerLength > 16384) { Error(stream, 400, false); return; }
                    }
                    bool head = request[0] == "HEAD";
                    if (request[0] != "GET" && !head) { Error(stream, 405, false); return; }
                    string raw = request[1].Split('?')[0];
                    string path = Uri.UnescapeDataString(raw);
                    if (!path.StartsWith("/") || path.Contains("\\") || path.Contains(":") || path.IndexOf('\0') >= 0) { Error(stream, 403, head); return; }
                    foreach (string segment in path.Split('/')) {
                        if (segment == ".." || segment == ".") { Error(stream, 403, head); return; }
                    }
                    if (path == "/") path = "/index.html";
                    // Only game assets can be served, even if other files are later
                    // placed beside the executable. The listener is loopback-only.
                    bool allowed = path == "/index.html" || path == "/style.css" || path.StartsWith("/src/") || path.StartsWith("/config/") || path.StartsWith("/assets/sprites/");
                    if (!allowed) { Error(stream, 404, head); return; }
                    string file = Path.GetFullPath(Path.Combine(root, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar)));
                    if (!file.StartsWith(root, StringComparison.OrdinalIgnoreCase)) { Error(stream, 403, head); return; }
                    if (!File.Exists(file)) { Error(stream, 404, head); return; }
                    string ext = Path.GetExtension(file).ToLowerInvariant();
                    string type = ext == ".html" ? "text/html; charset=utf-8" : ext == ".js" ? "text/javascript; charset=utf-8" : ext == ".css" ? "text/css; charset=utf-8" : ext == ".json" ? "application/json; charset=utf-8" : ext == ".png" ? "image/png" : "application/octet-stream";
                    Reply(stream, 200, type, File.ReadAllBytes(file), head);
                }
            } catch (IOException) { }
              catch (SocketException) { }
              catch (Exception) { /* A malformed local request must not close the game. */ }
        }
    }
    public void Dispose() { stopping = true; listener.Stop(); }
}

internal sealed class LauncherWindow : Form {
    private readonly LocalGameServer server;
    internal LauncherWindow(LocalGameServer gameServer) {
        server = gameServer;
        Text = "Arauto do Sol — Demo v0.6.0";
        ClientSize = new Size(510, 285);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        BackColor = Color.FromArgb(14, 21, 31);
        ForeColor = Color.FromArgb(222, 210, 181);
        Font = new Font("Segoe UI", 10);
        Label title = new Label { Text = "ARAUTO DO SOL", Left = 25, Top = 22, Width = 460, Height = 38, Font = new Font("Segoe UI", 23, FontStyle.Bold) };
        Label hint = new Label { Text = "Demo do Cemitério · animações v0.6.0\n\nO jogo abre no navegador. Mantenha esta janela aberta.\nFunciona offline e não precisa instalar programas.", Left = 28, Top = 72, Width = 455, Height = 92 };
        LinkLabel link = new LinkLabel { Text = server.Url, Left = 28, Top = 162, Width = 440, Height = 24, LinkColor = Color.FromArgb(135, 200, 207), ActiveLinkColor = Color.White };
        link.LinkClicked += delegate { OpenBrowser(); };
        Button open = MakeButton("Abrir o jogo", 28, 198);
        open.Click += delegate { OpenBrowser(); };
        Button close = MakeButton("Encerrar", 252, 198);
        close.Click += delegate { Close(); };
        Label foot = new Label { Text = "Fechar ou recarregar o jogo inicia uma nova partida.", Left = 28, Top = 249, Width = 470, Height = 23, Font = new Font("Segoe UI", 9) };
        Controls.AddRange(new Control[] { title, hint, link, open, close, foot });
        Shown += delegate { OpenBrowser(); };
        FormClosed += delegate { server.Dispose(); };
    }
    private static Button MakeButton(string text, int x, int y) {
        return new Button { Text = text, Left = x, Top = y, Width = 204, Height = 37, FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(35, 50, 64), ForeColor = Color.FromArgb(238, 219, 178) };
    }
    private void OpenBrowser() {
        try { System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo(server.Url) { UseShellExecute = true }); }
        catch (Exception) { MessageBox.Show("Abra seu navegador e digite:\n\n" + server.Url, "Abrir Arauto do Sol", MessageBoxButtons.OK, MessageBoxIcon.Information); }
    }
}

internal static class Program {
    private static string RawRequest(string url, string path, string method) {
        Uri uri = new Uri(url);
        using (TcpClient client = new TcpClient("127.0.0.1", uri.Port)) {
            client.ReceiveTimeout = 5000;
            using (NetworkStream stream = client.GetStream()) {
                byte[] bytes = Encoding.ASCII.GetBytes(method + " " + path + " HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
                stream.Write(bytes, 0, bytes.Length);
                using (StreamReader reader = new StreamReader(stream)) return reader.ReadToEnd();
            }
        }
    }
    private static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
    private static int SelfTest(string root, string report) {
        List<string> log = new List<string>();
        try {
            using (LocalGameServer server = new LocalGameServer(root)) {
                List<string> files = new List<string>(new string[] { Path.Combine(root, "index.html"), Path.Combine(root, "style.css") });
                files.AddRange(Directory.GetFiles(Path.Combine(root, "src"), "*", SearchOption.AllDirectories));
                files.AddRange(Directory.GetFiles(Path.Combine(root, "config"), "*", SearchOption.AllDirectories));
                files.AddRange(Directory.GetFiles(Path.Combine(root, "assets", "sprites"), "*", SearchOption.AllDirectories));
                using (WebClient web = new WebClient()) {
                    web.Proxy = null;
                    foreach (string file in files) {
                        string relative = file.Substring(root.Length).TrimStart(Path.DirectorySeparatorChar).Replace(Path.DirectorySeparatorChar, '/');
                        byte[] actual = web.DownloadData(server.Url + relative), expected = File.ReadAllBytes(file);
                        Check(Convert.ToBase64String(actual) == Convert.ToBase64String(expected), "Conteúdo divergente: " + relative);
                    }
                }
                log.Add("PASSOU: " + files.Count + " arquivos servidos integralmente pelo executável, sem Node.js.");
                string head = RawRequest(server.Url, "/src/main.js", "HEAD");
                Check(head.Contains("200 OK") && head.Contains("text/javascript") && head.EndsWith("\r\n\r\n"), "HEAD/MIME incorreto");
                log.Add("PASSOU: MIME JavaScript e requisições HEAD.");
                Check(RawRequest(server.Url, "/assets/sprites/protagonist/v2/player/idle/idle-0.png", "HEAD").Contains("image/png"), "MIME PNG incorreto");
                Check(RawRequest(server.Url, "/assets/sprites/protagonist/manifest.json", "HEAD").Contains("application/json"), "MIME manifesto incorreto");
                Check(RawRequest(server.Url, "/assets/raw/protagonist/reference.png", "GET").Contains("404 Not Found"), "RAW exposto");
                log.Add("PASSOU: sprites finais e manifesto disponíveis; RAW inacessível.");
                Check(RawRequest(server.Url, "/src/%2e%2e/%2e%2e/privado.txt", "GET").Contains("403 Forbidden"), "Traversal permitido");
                Check(RawRequest(server.Url, "/Jogar.exe", "GET").Contains("404 Not Found"), "Arquivo fora do jogo exposto");
                Check(RawRequest(server.Url, "/src/ausente.js", "GET").Contains("404 Not Found"), "404 incorreto");
                Check(RawRequest(server.Url, "/", "POST").Contains("405 Method Not Allowed"), "Método de escrita aceito");
                log.Add("PASSOU: caminhos externos, arquivos alheios, arquivo ausente e métodos de escrita bloqueados.");
                using (LocalGameServer second = new LocalGameServer(root)) Check(second.Url != server.Url, "Porta duplicada");
                log.Add("PASSOU: duas instâncias coexistem em portas livres, somente em 127.0.0.1.");
            }
            File.WriteAllLines(report, log.ToArray(), Encoding.UTF8);
            return 0;
        } catch (Exception error) {
            log.Add("FALHOU: " + error.ToString());
            File.WriteAllLines(report, log.ToArray(), Encoding.UTF8);
            return 1;
        }
    }
    [STAThread]
    private static int Main(string[] args) {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        if (args.Length == 2 && args[0] == "--self-test") return SelfTest(root, args[1]);
        if (args.Length == 2 && args[0] == "--serve-test") {
            using (LocalGameServer testServer = new LocalGameServer(root)) {
                File.WriteAllText(args[1], testServer.Url, Encoding.UTF8);
                Thread.Sleep(180000);
            }
            return 0;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try {
            using (LocalGameServer server = new LocalGameServer(root)) Application.Run(new LauncherWindow(server));
            return 0;
        } catch (Exception error) {
            MessageBox.Show(error.Message, "Não foi possível iniciar Arauto do Sol", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
    }
}

