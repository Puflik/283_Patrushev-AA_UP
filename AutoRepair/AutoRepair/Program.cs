using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
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

        DefaultFilesOptions options = new DefaultFilesOptions();
        options.DefaultFileNames.Clear();
<<<<<<< HEAD
        options.DefaultFileNames.Add("html/login.html");
        app.UseDefaultFiles(options);
        app.UseStaticFiles();

        // ──────────────────────────────────────────────────────
        // GET списки
        // ──────────────────────────────────────────────────────
=======
        options.DefaultFileNames.Add("html/login.html"); 
        app.UseDefaultFiles(options);
        app.UseStaticFiles();

>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        app.MapGet("/api/users", async (ApplicationDbContext db) =>
        {
            try { return Results.Ok(await db.Users.ToListAsync()); }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

<<<<<<< HEAD
        app.MapGet("/api/requests", async (ApplicationDbContext db) =>
        {
            try { return Results.Ok(await db.Requests.ToListAsync()); }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/comments", async (ApplicationDbContext db) =>
        {
            try { return Results.Ok(await db.Comments.ToListAsync()); }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapGet("/api/messages", async (ApplicationDbContext db) =>
        {
            try { return Results.Ok(await db.Messages.ToListAsync()); }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // ВАЖНО: маршруты с литеральными сегментами (client/master/search)
        // должны быть зарегистрированы ДО /api/requests/{id},
        // иначе ASP.NET Core перехватит "client" как id.
        // ──────────────────────────────────────────────────────
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

        app.MapGet("/api/comments/request/{requestId}", async (ApplicationDbContext db, int requestId) =>
        {
            try
            {
                var list = await db.Comments.Where(c => c.RequestID == requestId).ToListAsync();
                return Results.Ok(list);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // GET по id — после литеральных маршрутов
        // ──────────────────────────────────────────────────────
=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
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

        app.MapGet("/api/requests/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var request = await db.Requests.FindAsync(id);
                if (request == null) return Results.NotFound();
                return Results.Ok(request);
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

<<<<<<< HEAD
        // ──────────────────────────────────────────────────────
        // POST
        // ──────────────────────────────────────────────────────
=======
        app.MapGet("/api/requests/client/{clientId}", async (ApplicationDbContext db, int clientId) =>
        {
            try
            {
                var request = await db.Requests.Where(r => r.ClientID == clientId).ToListAsync();
                return Results.Ok(request);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/requests/master/{masterId}", async (ApplicationDbContext db, int masterId) =>
        {
            try
            {
                var request = await db.Requests.Where(r => r.MasterID == masterId).ToListAsync();
                return Results.Ok(request);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/comments/request/{requestId}", async (ApplicationDbContext db, int requestId) =>
        {
            try
            {
                var comment = await db.Comments.Where(c => c.RequestID == requestId).ToListAsync();
                return Results.Ok(comment);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        app.MapPost("/api/users", async (User user, ApplicationDbContext db) =>
        {
            try
            {
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
                return Results.Created($"/api/users/{user.UserID}", user);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPost("/api/requests", async (Request request, ApplicationDbContext db) =>
        {
            try
            {
                // Нормализуем статус: если пришёл английский — переводим в русский
                request.RequestStatus = NormalizeStatus(request.RequestStatus);
                await db.Requests.AddAsync(request);
                await db.SaveChangesAsync();
                return Results.Created($"/api/requests/{request.RequestID}", request);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPost("/api/comments", async (Comment comment, ApplicationDbContext db) =>
        {
            try
            {
                await db.Comments.AddAsync(comment);
                await db.SaveChangesAsync();
                return Results.Created($"/api/comments/{comment.CommentID}", comment);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

<<<<<<< HEAD
        app.MapPost("/api/messages", async (Message message, ApplicationDbContext db) =>
        {
            try
            {
                await db.Messages.AddAsync(message);
                await db.SaveChangesAsync();
                return Results.Created($"/api/messages/{message.MessageID}", message);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        // ──────────────────────────────────────────────────────
        // PUT
        // ──────────────────────────────────────────────────────
=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        app.MapPut("/api/users", async (User userData, ApplicationDbContext db) =>
        {
            try
            {
                var user = await db.Users.FirstOrDefaultAsync(u => u.UserID == userData.UserID);
                if (user == null) return Results.NotFound();
                user.Fio = userData.Fio;
                user.Phone = userData.Phone;
                user.Login = userData.Login;
                user.Password = userData.Password;
                user.Type = userData.Type;
                await db.SaveChangesAsync();
                return Results.Ok(user);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/requests", async (RequestUpdateDto requestData, ApplicationDbContext db) =>
        {
            try
            {
                var request = await db.Requests.FirstOrDefaultAsync(r => r.RequestID == requestData.RequestID);
                if (request == null) return Results.NotFound();

                // Обновляем только переданные поля (не null)
                if (requestData.CarType != null) request.CarType = requestData.CarType;
                if (requestData.CarModel != null) request.CarModel = requestData.CarModel;
                if (requestData.ProblemDescryption != null) request.ProblemDescryption = requestData.ProblemDescryption;
                if (requestData.RequestStatus != null)
                    request.RequestStatus = NormalizeStatus(requestData.RequestStatus);
                if (requestData.CompletionDate.HasValue) request.CompletionDate = requestData.CompletionDate;
                if (requestData.RepairParts != null) request.RepairParts = requestData.RepairParts;
                // MasterID: обновляем если передан (включая 0 — нет)
                if (requestData.MasterID.HasValue) request.MasterID = requestData.MasterID == 0 ? null : requestData.MasterID;

                await db.SaveChangesAsync();
                return Results.Ok(request);
            }
            catch (Exception ex) { return Results.Problem(detail: ex.Message, title: "Ошибка", statusCode: 500); }
        });

        app.MapPut("/api/comments", async (Comment commentData, ApplicationDbContext db) =>
        {
            try
            {
                var comment = await db.Comments.FirstOrDefaultAsync(c => c.CommentID == commentData.CommentID);
                if (comment == null) return Results.NotFound();
                comment.Message = commentData.Message;
                await db.SaveChangesAsync();
                return Results.Ok(comment);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

<<<<<<< HEAD
        // ──────────────────────────────────────────────────────
        // DELETE
        // ──────────────────────────────────────────────────────
=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        app.MapDelete("/api/users/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var user = await db.Users.FindAsync(id);
                if (user == null) return Results.NotFound();
                db.Users.Remove(user);
                await db.SaveChangesAsync();
                return Results.Ok(user);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });

        app.MapDelete("/api/requests/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var request = await db.Requests.FindAsync(id);
                if (request == null) return Results.NotFound();
                db.Requests.Remove(request);
                await db.SaveChangesAsync();
                return Results.Ok(request);
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
                return Results.Ok(comment);
            }
            catch { return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500); }
        });
<<<<<<< HEAD

        // ──────────────────────────────────────────────────────
        // AUTH
        // ──────────────────────────────────────────────────────
=======
        app.MapGet("/api/requests/search", async (ApplicationDbContext db, string? status, string? query) => {
            try
            {
                var q = db.Requests.AsQueryable();
                if (!string.IsNullOrEmpty(status) && status != "all")
                    q = q.Where(r => r.RequestStatus == status);
                if (!string.IsNullOrEmpty(query))
                    q = q.Where(r => r.CarModel.Contains(query) || r.ProblemDescryption.Contains(query) || r.RequestID.ToString() == query);
                return Results.Ok(await q.ToListAsync());
            }
            catch (Exception ex)
            {
                return Results.Problem("Ошибка поиска: " + ex.Message);
            }
        });
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
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

                // Возвращаем camelCase явно
                return Results.Ok(new { userID = user.UserID, fio = user.Fio, type = user.Type });
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

<<<<<<< HEAD
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

                // Возвращаем camelCase явно
                return Results.Ok(new {
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
        // Страницы (HTML)
        // ──────────────────────────────────────────────────────
=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
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

        app.MapGet("/login", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/login.html", false);
            return Results.Empty;
        });
        app.MapGet("/profile", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/profile.html");
            return Results.Empty;
        });
        app.MapGet("/profile", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/profile.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/my-requests", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/my-requests.html");
            return Results.Empty;
        });
        app.MapGet("/create-request", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/create-request.html");
            return Results.Empty;
        });
        app.MapGet("/request-detail", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/request-detail.html");
            return Results.Empty;
        });
        app.MapGet("/faq", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/faq.html", false);
            return Results.Empty;
        });
        app.MapGet("/contact", async (HttpContext ctx) =>
        {
            await ServePage(ctx, "html/contact.html", false);
            return Results.Empty;
        });
<<<<<<< HEAD
=======

>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
        app.MapGet("/requests", async (HttpContext ctx) =>
        {
            if (!ctx.User.Identity!.IsAuthenticated) { ctx.Response.Redirect("/login"); return Results.Empty; }
            await ServePage(ctx, "html/requests.html");
            return Results.Empty;
        });
        app.MapGet("/request-card", async (HttpContext ctx) =>
        {
            if (!ctx.User.Identity!.IsAuthenticated) { ctx.Response.Redirect("/login"); return Results.Empty; }
            await ServePage(ctx, "html/request-card.html");
            return Results.Empty;
        });
        app.MapGet("/assign", async (HttpContext ctx) =>
        {
            if (!ctx.User.IsInRole("manager") && !ctx.User.IsInRole("admin"))
                return Results.Redirect("/requests");
            await ServePage(ctx, "html/assign.html");
            return Results.Empty;
        });
        app.MapGet("/statistics", async (HttpContext ctx) =>
        {
            if (!ctx.User.Identity!.IsAuthenticated) { ctx.Response.Redirect("/login"); return Results.Empty; }
            await ServePage(ctx, "html/statistics.html");
            return Results.Empty;
        });
        app.MapGet("/staff", async (HttpContext ctx) =>
        {
            if (!ctx.User.IsInRole("admin")) return Results.Redirect("/requests");
            await ServePage(ctx, "html/staff.html");
            return Results.Empty;
        });
        app.MapGet("/messages", async (HttpContext ctx) =>
        {
            if (!ctx.User.Identity!.IsAuthenticated) return Results.Redirect("/login");
            await ServePage(ctx, "html/messages.html");
            return Results.Empty;
        });

        app.MapGet("/api/me", async (HttpContext ctx, ApplicationDbContext db) => {
            try
            {
                if (!ctx.User.Identity!.IsAuthenticated)
                    return Results.Unauthorized();

                var userIdClaim = ctx.User.FindFirst("userID")?.Value;
                if (userIdClaim == null) return Results.Unauthorized();

                var user = await db.Users.FindAsync(int.Parse(userIdClaim));
                if (user == null) return Results.Unauthorized();

                return Results.Ok(user);
            }
            catch (Exception ex)
            {
                return Results.Problem("Ошибка: " + ex.Message);
            }
        });

        app.MapPost("/api/messages", async (Message message, ApplicationDbContext db) => {
            try
            {
                await db.Messages.AddAsync(message);
                await db.SaveChangesAsync();
                return Results.Created($"/api/messages/{message.MessageID}", message);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.Run();
    }

    // Нормализация статусов: английские → русские (как в БД)
    private static string NormalizeStatus(string status) => status switch
    {
        "new"         => "Новая заявка",
        "in_progress" => "В процессе ремонта",
        "waiting"     => "Ожидание автозапчастей",
        "done"        => "Готова к выдаче",
        "cancelled"   => "Отменена",
        _             => status   // уже русский — оставляем
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

// DTO для PUT /api/requests — все поля кроме ID опциональны
public class RequestUpdateDto
{
    public int RequestID { get; set; }
    public string? CarType { get; set; }
    public string? CarModel { get; set; }
    public string? ProblemDescryption { get; set; }
    public string? RequestStatus { get; set; }
    public DateOnly? CompletionDate { get; set; }
    public string? RepairParts { get; set; }
    public int? MasterID { get; set; }
    public int? ClientID { get; set; }
}

public class Comment
{
    public int CommentID { get; set; }
    public required string Message { get; set; }
    public int MasterID { get; set; }
    public int RequestID { get; set; }
}
<<<<<<< HEAD

=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
public class Message
{
    public int MessageID { get; set; }
    public required string Subject { get; set; }
    public required string MessageText { get; set; }
    public int ClientID { get; set; }
}
<<<<<<< HEAD

=======
>>>>>>> 15f748bc242f4638a09b984bc58142a7323b85b2
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    public DbSet<User> Users { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<Message> Messages { get; set; }
}

record class Person(string Login, string Password);
