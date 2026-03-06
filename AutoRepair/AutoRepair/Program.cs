using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;

internal class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Configuration.AddJsonFile("appsettings.json");
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

        builder.Services.AddAuthorization();
        builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.LoginPath = "/login";
                options.AccessDeniedPath = "/accessdenied";
            });

        // Настройка JSON: camelCase для фронтенда
        builder.Services.ConfigureHttpJsonOptions(opts =>
        {
            opts.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

        var app = builder.Build();

        app.UseAuthentication();
        app.UseAuthorization();

        DefaultFilesOptions defaultOptions = new DefaultFilesOptions();
        defaultOptions.DefaultFileNames.Clear();
        defaultOptions.DefaultFileNames.Add("html/login.html");
        app.UseDefaultFiles(defaultOptions);
        app.UseStaticFiles();

        // ──────────────────────────────────────────────────────
        // Страницы (HTML)
        // ──────────────────────────────────────────────────────
        async Task ServePage(HttpContext ctx, string fileName, bool requireAuth = true)
        {
            if (requireAuth && !ctx.User.Identity!.IsAuthenticated)
            {
                ctx.Response.Redirect("/login");
                return;
            }
            ctx.Response.ContentType = "text/html; charset=utf-8";
            string path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", fileName);
            if (File.Exists(path))
                await ctx.Response.WriteAsync(await File.ReadAllTextAsync(path));
        }

        app.MapGet("/login", async (HttpContext ctx) => { await ServePage(ctx, "html/login.html", false); return Results.Empty; });
        app.MapGet("/profile", async (HttpContext ctx) => { await ServePage(ctx, "html/profile.html"); return Results.Empty; });
        app.MapGet("/my-requests", async (HttpContext ctx) => { await ServePage(ctx, "html/my-requests.html"); return Results.Empty; });
        app.MapGet("/create-request", async (HttpContext ctx) => { await ServePage(ctx, "html/create-request.html"); return Results.Empty; });
        app.MapGet("/request-detail", async (HttpContext ctx) => { await ServePage(ctx, "html/request-detail.html"); return Results.Empty; });
        app.MapGet("/faq", async (HttpContext ctx) => { await ServePage(ctx, "html/faq.html", false); return Results.Empty; });
        app.MapGet("/contact", async (HttpContext ctx) => { await ServePage(ctx, "html/contact.html", false); return Results.Empty; });
        app.MapGet("/requests", async (HttpContext ctx) => { await ServePage(ctx, "html/requests.html"); return Results.Empty; });
        app.MapGet("/request-card", async (HttpContext ctx) => { await ServePage(ctx, "html/request-card.html"); return Results.Empty; });
        app.MapGet("/statistics", async (HttpContext ctx) => { await ServePage(ctx, "html/statistics.html"); return Results.Empty; });
        app.MapGet("/messages", async (HttpContext ctx) => { await ServePage(ctx, "html/messages.html"); return Results.Empty; });
        app.MapGet("/assign", async (HttpContext ctx) =>
        {
            if (!ctx.User.IsInRole("Менеджер") && !ctx.User.IsInRole("manager") && !ctx.User.IsInRole("Администратор") && !ctx.User.IsInRole("admin"))
                return Results.Redirect("/requests");
            await ServePage(ctx, "html/assign.html");
            return Results.Empty;
        });
        app.MapGet("/staff", async (HttpContext ctx) =>
        {
            if (!ctx.User.IsInRole("Администратор") && !ctx.User.IsInRole("admin")) return Results.Redirect("/requests");
            await ServePage(ctx, "html/staff.html");
            return Results.Empty;
        });

        // ──────────────────────────────────────────────────────
        // AUTH
        // ──────────────────────────────────────────────────────

        app.MapPost("/api/login", async (HttpContext context, ApplicationDbContext db, Person person) =>
        {
            try
            {
                var user = await db.Users.FirstOrDefaultAsync(
                    u => u.Login == person.Login && u.Password == person.Password);
                if (user == null)
                    return Results.Json(new { message = "Неверный логин или пароль" }, statusCode: 401);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Login),
                    new Claim(ClaimTypes.Role, user.Type),
                    new Claim("userID", user.UserID.ToString())
                };
                var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                await context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity));

                return Results.Ok(new { userID = user.UserID, fio = user.Fio, phone = user.Phone, login = user.Login, type = user.Type });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/logout", async (HttpContext context) =>
        {
            try
            {
                await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Results.Redirect("/login");
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/me", async (HttpContext ctx, ApplicationDbContext db) =>
        {
            try
            {
                if (!ctx.User.Identity!.IsAuthenticated)
                    return Results.Unauthorized();

                var userIdClaim = ctx.User.FindFirst("userID")?.Value;
                if (userIdClaim == null) return Results.Unauthorized();

                var user = await db.Users.FindAsync(int.Parse(userIdClaim));
                if (user == null) return Results.Unauthorized();

                return Results.Ok(new
                {
                    userID = user.UserID,
                    fio = user.Fio,
                    phone = user.Phone,
                    login = user.Login,
                    password = user.Password,
                    type = user.Type
                });
            }
            catch (Exception ex) { return Results.Problem("Ошибка: " + ex.Message); }
        });

        // ──────────────────────────────────────────────────────
        // USERS
        // ──────────────────────────────────────────────────────

        app.MapGet("/api/users", async (ApplicationDbContext db) =>
        {
            try { return Results.Ok(await db.Users.ToListAsync()); }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/users/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var user = await db.Users.FindAsync(id);
                if (user == null) return Results.NotFound();
                return Results.Ok(user);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // POST /api/users — регистрация клиента
        app.MapPost("/api/users", async (UserCreateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Login))
                    return Results.Json(new { message = "Данные не заполнены" }, statusCode: 400);

                var exists = await db.Users.AnyAsync(u => u.Login == dto.Login);
                if (exists)
                    return Results.Json(new { message = "Логин уже занят" }, statusCode: 409);

                var user = new User
                {
                    Fio = dto.Fio ?? "",
                    Phone = dto.Phone ?? "",
                    Login = dto.Login,
                    Password = dto.Password ?? "",
                    Type = "Заказчик"
                };
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
                return Results.Created($"/api/users/{user.UserID}", new { userID = user.UserID });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // POST /api/users/staff — создание сотрудника (admin)
        app.MapPost("/api/users/staff", async (UserCreateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var exists = await db.Users.AnyAsync(u => u.Login == dto.Login);
                if (exists)
                    return Results.Json(new { message = "Логин занят" }, statusCode: 409);

                var user = new User
                {
                    Fio = dto.Fio ?? "",
                    Phone = dto.Phone ?? "",
                    Login = dto.Login ?? "",
                    Password = dto.Password ?? "",
                    Type = dto.Type ?? "Автомеханик"
                };
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
                return Results.Created($"/api/users/{user.UserID}", new { userID = user.UserID });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // PUT /api/users/{id} — обновление профиля
        app.MapPut("/api/users/{id}", async (int id, UserUpdateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var user = await db.Users.FindAsync(id);
                if (user == null) return Results.NotFound();
                user.Fio = dto.Fio ?? user.Fio;
                user.Phone = dto.Phone ?? user.Phone;
                user.Login = dto.Login ?? user.Login;
                if (!string.IsNullOrWhiteSpace(dto.Password))
                    user.Password = dto.Password;
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // DELETE /api/users/{id} — мягкое удаление (деактивация)
        app.MapDelete("/api/users/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var user = await db.Users.FindAsync(id);
                if (user == null) return Results.NotFound();
                if (!user.Type.StartsWith("inactive_"))
                    user.Type = "inactive_" + user.Type;
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // REQUESTS
        // ──────────────────────────────────────────────────────

        // ВАЖНО: литеральные маршруты регистрируются ДО /api/requests/{id}
        app.MapGet("/api/requests/search", async (ApplicationDbContext db, string? status, string? query) =>
        {
            try
            {
                var q = db.Requests.AsQueryable();
                if (!string.IsNullOrEmpty(status) && status != "all")
                    q = q.Where(r => r.RequestStatus == status);
                if (!string.IsNullOrEmpty(query))
                    q = q.Where(r => r.CarModel.Contains(query) || r.ProblemDescryption.Contains(query) || r.RequestID.ToString() == query);
                return Results.Ok(await q.ToListAsync());
            }
            catch (Exception ex) { return Results.Problem("Ошибка поиска: " + ex.Message); }
        });

        app.MapGet("/api/requests/client/{clientId}", async (ApplicationDbContext db, int clientId) =>
        {
            try
            {
                var list = await db.Requests.Where(r => r.ClientID == clientId).ToListAsync();
                return Results.Ok(list);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/requests/master/{masterId}", async (ApplicationDbContext db, int masterId) =>
        {
            try
            {
                var list = await db.Requests.Where(r => r.MasterID == masterId).ToListAsync();
                return Results.Ok(list);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // GET /api/requests — с фильтрацией по роли и с clientFio
        app.MapGet("/api/requests", async (HttpContext ctx, ApplicationDbContext db) =>
        {
            try
            {
                var userIdClaim = ctx.User.FindFirst("userID")?.Value;
                var userType = ctx.User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                IQueryable<Request> q = db.Requests;

                if ((userType == "mechanic" || userType == "Автомеханик") && userIdClaim != null)
                    q = q.Where(r => r.MasterID == int.Parse(userIdClaim));
                else if ((userType == "client" || userType == "Заказчик") && userIdClaim != null)
                    q = q.Where(r => r.ClientID == int.Parse(userIdClaim));

                var requests = await q.OrderByDescending(r => r.RequestID).ToListAsync();
                var userIds = requests.Select(r => r.ClientID).Distinct().ToList();
                var users = await db.Users.Where(u => userIds.Contains(u.UserID)).ToDictionaryAsync(u => u.UserID);

                var masterIds = requests.Where(r => r.MasterID.HasValue).Select(r => r.MasterID!.Value).Distinct().ToList();
                var masterDict = await db.Users.Where(u => masterIds.Contains(u.UserID)).ToDictionaryAsync(u => u.UserID);

                var result = requests.Select(r => new {
                    requestID = r.RequestID,
                    startDate = r.StartDate.ToString("yyyy-MM-dd"),
                    carType = r.CarType,
                    carModel = r.CarModel,
                    problemDescryption = r.ProblemDescryption,
                    requestStatus = r.RequestStatus,
                    completionDate = r.CompletionDate?.ToString("yyyy-MM-dd"),
                    repairParts = r.RepairParts,
                    masterID = r.MasterID,
                    clientID = r.ClientID,
                    clientFio = users.TryGetValue(r.ClientID, out var u) ? u.Fio : null,
                    masterFio = r.MasterID.HasValue && masterDict.TryGetValue(r.MasterID.Value, out var m) ? m.Fio : null
                });

                return Results.Ok(result);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/requests/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var r = await db.Requests.FindAsync(id);
                if (r == null) return Results.NotFound();

                var client = await db.Users.FindAsync(r.ClientID);
                User? master = r.MasterID.HasValue ? await db.Users.FindAsync(r.MasterID.Value) : null;

                return Results.Ok(new
                {
                    requestID = r.RequestID,
                    startDate = r.StartDate.ToString("yyyy-MM-dd"),
                    carType = r.CarType,
                    carModel = r.CarModel,
                    problemDescryption = r.ProblemDescryption,
                    requestStatus = r.RequestStatus,
                    completionDate = r.CompletionDate?.ToString("yyyy-MM-dd"),
                    repairParts = r.RepairParts,
                    masterID = r.MasterID,
                    clientID = r.ClientID,
                    clientFio = client?.Fio,
                    clientPhone = client?.Phone,
                    masterFio = master?.Fio
                });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPost("/api/requests", async (RequestCreateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var request = new Request
                {
                    StartDate = DateOnly.TryParse(dto.StartDate, out var sd) ? sd : DateOnly.FromDateTime(DateTime.Today),
                    CarType = dto.CarType ?? "",
                    CarModel = dto.CarModel ?? "",
                    ProblemDescryption = dto.ProblemDescryption ?? "",
                    RequestStatus = "Новая заявка",
                    ClientID = dto.ClientID,
                    CompletionDate = DateOnly.TryParse(dto.CompletionDate, out var cd) ? cd : null
                };
                await db.Requests.AddAsync(request);
                await db.SaveChangesAsync();
                return Results.Created($"/api/requests/{request.RequestID}", new { requestID = request.RequestID });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/requests/{id}", async (int id, RequestUpdateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var request = await db.Requests.FindAsync(id);
                if (request == null) return Results.NotFound();

                if (dto.RequestStatus != null) request.RequestStatus = NormalizeStatus(dto.RequestStatus);
                if (dto.MasterID.HasValue) request.MasterID = dto.MasterID == 0 ? null : dto.MasterID;
                if (dto.RepairParts != null) request.RepairParts = dto.RepairParts;
                if (dto.CompletionDate != null)
                    request.CompletionDate = DateOnly.TryParse(dto.CompletionDate, out var cd) ? cd : null;
                if (dto.CarType != null) request.CarType = dto.CarType;
                if (dto.CarModel != null) request.CarModel = dto.CarModel;
                if (dto.ProblemDescryption != null) request.ProblemDescryption = dto.ProblemDescryption;

                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch (Exception ex) { return Results.Problem(detail: ex.Message, title: "Ошибка", statusCode: 500); }
        });

        app.MapDelete("/api/requests/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var request = await db.Requests.FindAsync(id);
                if (request == null) return Results.NotFound();
                db.Requests.Remove(request);
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // COMMENTS
        // ──────────────────────────────────────────────────────

        app.MapGet("/api/comments/request/{requestId}", async (ApplicationDbContext db, int requestId) =>
        {
            try
            {
                var list = await db.Comments.Where(c => c.RequestID == requestId).ToListAsync();
                return Results.Ok(list);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // GET /api/comments?requestID=X — с masterFio
        app.MapGet("/api/comments", async (HttpContext ctx, ApplicationDbContext db) =>
        {
            try
            {
                if (!int.TryParse(ctx.Request.Query["requestID"], out var rid))
                    return Results.BadRequest(new { message = "requestID обязателен" });

                var comments = await db.Comments.Where(c => c.RequestID == rid).ToListAsync();
                var masterIds = comments.Select(c => c.MasterID).Distinct().ToList();
                var masters = await db.Users.Where(u => masterIds.Contains(u.UserID)).ToDictionaryAsync(u => u.UserID);

                var result = comments.Select(c => new {
                    commentID = c.CommentID,
                    message = c.Message,
                    masterID = c.MasterID,
                    requestID = c.RequestID,
                    masterFio = masters.TryGetValue(c.MasterID, out var m) ? m.Fio : null
                });
                return Results.Ok(result);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/comments/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var comment = await db.Comments.FindAsync(id);
                if (comment == null) return Results.NotFound();
                return Results.Ok(comment);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPost("/api/comments", async (CommentCreateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var comment = new Comment
                {
                    Message = dto.Message ?? "",
                    MasterID = dto.MasterID,
                    RequestID = dto.RequestID
                };
                await db.Comments.AddAsync(comment);
                await db.SaveChangesAsync();
                return Results.Created($"/api/comments/{comment.CommentID}", new { commentID = comment.CommentID });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/comments", async (Comment commentData, ApplicationDbContext db) =>
        {
            try
            {
                var comment = await db.Comments.FindAsync(commentData.CommentID);
                if (comment == null) return Results.NotFound();
                comment.Message = commentData.Message;
                await db.SaveChangesAsync();
                return Results.Ok(comment);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapDelete("/api/comments/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var comment = await db.Comments.FindAsync(id);
                if (comment == null) return Results.NotFound();
                db.Comments.Remove(comment);
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // MESSAGES
        // ──────────────────────────────────────────────────────

        app.MapGet("/api/messages", async (HttpContext ctx, ApplicationDbContext db) =>
        {
            try
            {
                var userIdClaim = ctx.User.FindFirst("userID")?.Value;
                var userType = ctx.User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                IQueryable<Message> q = db.Messages;
                if ((userType == "client" || userType == "Заказчик") && userIdClaim != null)
                    q = q.Where(m => m.ClientID == int.Parse(userIdClaim));

                var messages = await q.OrderByDescending(m => m.MessageID).ToListAsync();
                var clientIds = messages.Select(m => m.ClientID).Distinct().ToList();
                var clients = await db.Users.Where(u => clientIds.Contains(u.UserID)).ToDictionaryAsync(u => u.UserID);

                var result = messages.Select(m => new {
                    messageID = m.MessageID,
                    subject = m.Subject,
                    messageText = m.MessageText,
                    clientID = m.ClientID,
                    sentAt = m.SentAt?.ToString("yyyy-MM-dd"),
                    isRead = m.IsRead,
                    reply = m.Reply,
                    clientFio = clients.TryGetValue(m.ClientID, out var u) ? u.Fio : null
                });
                return Results.Ok(result);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPost("/api/messages", async (MessageCreateDto dto, ApplicationDbContext db) =>
        {
            try
            {
                var message = new Message
                {
                    Subject = dto.Subject ?? "",
                    MessageText = dto.MessageText ?? "",
                    ClientID = dto.ClientID,
                    SentAt = DateOnly.FromDateTime(DateTime.Today),
                    IsRead = false,
                    Reply = null
                };
                await db.Messages.AddAsync(message);
                await db.SaveChangesAsync();
                return Results.Created($"/api/messages/{message.MessageID}", new { messageID = message.MessageID });
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/messages/{id}/read", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var msg = await db.Messages.FindAsync(id);
                if (msg == null) return Results.NotFound();
                msg.IsRead = true;
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/messages/{id}/reply", async (ApplicationDbContext db, int id, ReplyDto dto) =>
        {
            try
            {
                var msg = await db.Messages.FindAsync(id);
                if (msg == null) return Results.NotFound();
                msg.Reply = dto.Reply ?? "";
                msg.IsRead = true;
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // STATISTICS
        // ──────────────────────────────────────────────────────

        app.MapGet("/api/statistics", async (HttpContext ctx, ApplicationDbContext db) =>
        {
            try
            {
                var period = ctx.Request.Query["period"].FirstOrDefault() ?? "month";

                var allReqs = await db.Requests.ToListAsync();
                var allUsers = await db.Users.ToListAsync();

                // Фильтр по периоду
                var today = DateOnly.FromDateTime(DateTime.Today);
                IEnumerable<Request> filtered = allReqs;
                filtered = period switch
                {
                    "week" => allReqs.Where(r => r.StartDate >= today.AddDays(-7)),
                    "month" => allReqs.Where(r => r.StartDate.Year == today.Year && r.StartDate.Month == today.Month),
                    "quarter" => allReqs.Where(r => r.StartDate >= today.AddMonths(-3)),
                    "year" => allReqs.Where(r => r.StartDate.Year == today.Year),
                    _ => allReqs
                };
                var list = filtered.ToList();

                var done = list.Count(r => r.RequestStatus == "Готова к выдаче");
                var waiting = list.Count(r => r.RequestStatus == "Новая заявка" && r.MasterID == null);
                var newClients = list.Select(r => r.ClientID).Distinct().Count();

                var durations = list
                    .Where(r => r.RequestStatus == "Готова к выдаче" && r.CompletionDate.HasValue)
                    .Select(r => (r.CompletionDate!.Value.DayNumber - r.StartDate.DayNumber))
                    .ToList();
                double? avgDays = durations.Count > 0 ? Math.Round(durations.Average(), 1) : null;

                // Bar chart по дням
                var bars = list
                    .GroupBy(r => r.StartDate)
                    .OrderBy(g => g.Key)
                    .Select(g => new { day = g.Key.ToString("dd.MM"), cnt = g.Count() })
                    .ToList();

                // Механики
                var mechanics = allUsers
                    .Where(u => (u.Type == "mechanic" || u.Type == "Автомеханик"))
                    .Select(u =>
                    {
                        var mechReqs = allReqs.Where(r => r.MasterID == u.UserID).ToList();
                        var doneReqs = mechReqs.Where(r => r.RequestStatus == "Готова к выдаче" && r.CompletionDate.HasValue).ToList();
                        var avgD = doneReqs.Count > 0
                            ? Math.Round(doneReqs.Average(r => r.CompletionDate!.Value.DayNumber - r.StartDate.DayNumber), 1)
                            : (double?)null;
                        var lastDate = mechReqs.Count > 0 ? mechReqs.Max(r => r.StartDate).ToString("dd.MM") : null;
                        return new { fio = u.Fio, doneCnt = doneReqs.Count, avgDays = avgD, lastDate };
                    })
                    .OrderByDescending(m => m.doneCnt)
                    .ToList();

                return Results.Ok(new { done, waiting, newClients, avgDays, bars, mechanics });
            }
            catch (Exception ex) { return Results.Problem("Ошибка статистики: " + ex.Message); }
        });

        app.Run();
    }

    // Нормализация статусов: английские → русские (как в БД)
    private static string NormalizeStatus(string status) => status switch
    {
        "new" => "Новая заявка",
        "in_progress" => "В процессе ремонта",
        "waiting" => "Ожидание автозапчастей",
        "done" => "Готова к выдаче",
        "cancelled" => "Отменена",
        _ => status   // уже русский — оставляем
    };
}

// ──────────────────────────────────────────────────────────────
// Модели
// ──────────────────────────────────────────────────────────────
public class User
{
    public int UserID { get; set; }
    public required string Fio { get; set; }
    public required string Phone { get; set; }
    public required string Login { get; set; }
    public required string Password { get; set; }
    public required string Type { get; set; }
}

public class Request
{
    public int RequestID { get; set; }
    public DateOnly StartDate { get; set; }
    public required string CarType { get; set; }
    public required string CarModel { get; set; }
    public required string ProblemDescryption { get; set; }
    public required string RequestStatus { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string? RepairParts { get; set; }
    public int? MasterID { get; set; }
    public int ClientID { get; set; }
}

public class Comment
{
    public int CommentID { get; set; }
    public required string Message { get; set; }
    public int MasterID { get; set; }
    public int RequestID { get; set; }
}

public class Message
{
    public int MessageID { get; set; }
    public required string Subject { get; set; }
    public required string MessageText { get; set; }
    public int ClientID { get; set; }
    public string? Reply { get; set; }
    public bool IsRead { get; set; } = false;
    public DateOnly? SentAt { get; set; }
}

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    public DbSet<User> Users { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Message> Messages { get; set; }
}

record class Person(string Login, string Password);

// ── DTO ──────────────────────────────────────────────────────────
record UserCreateDto(string? Fio, string? Phone, string? Login, string? Password, string? Type);
record UserUpdateDto(string? Fio, string? Phone, string? Login, string? Password);
record RequestCreateDto(string? StartDate, string? CarType, string? CarModel,
    string? ProblemDescryption, string? RequestStatus, int ClientID, string? CompletionDate);
record RequestUpdateDto(string? RequestStatus, int? MasterID,
    string? CompletionDate, string? RepairParts, string? CarType, string? CarModel, string? ProblemDescryption);
record CommentCreateDto(string? Message, int MasterID, int RequestID);
record MessageCreateDto(string? Subject, string? MessageText, int ClientID);
record ReplyDto(string? Reply);