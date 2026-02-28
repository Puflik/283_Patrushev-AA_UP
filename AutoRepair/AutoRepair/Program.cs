using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        var app = builder.Build();

        app.UseAuthentication();
        app.UseAuthorization();
        app.UseDefaultFiles();
        app.UseStaticFiles();

        // получение списка
        app.MapGet("/api/users", async (ApplicationDbContext db) =>
        {
            try
            {
                var users = await db.Users.ToListAsync();
                return Results.Ok(users);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/requests", async (ApplicationDbContext db) =>
        {
            try
            {
                var requests = await db.Requests.ToListAsync();
                return Results.Ok(requests);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/comments", async (ApplicationDbContext db) =>
        {
            try
            {
                var comments = await db.Comments.ToListAsync();
                return Results.Ok(comments);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // получение по id
        app.MapGet("/api/users/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var user = await db.Users.FindAsync(id);
                if (user == null) return Results.NotFound();
                return Results.Ok(user);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/requests/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var request = await db.Requests.FindAsync(id);
                if (request == null) return Results.NotFound();
                return Results.Ok(request);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/comments/{id}", async (ApplicationDbContext db, int id) =>
        {
            try
            {
                var comment = await db.Comments.FindAsync(id);
                if (comment == null) return Results.NotFound();
                return Results.Ok(comment);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

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

        // создание
        app.MapPost("/api/users", async (User user, ApplicationDbContext db) =>
        {
            try
            {
                await db.Users.AddAsync(user);
                await db.SaveChangesAsync();
                return Results.Created($"/api/users/{user.UserID}", user);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapPost("/api/requests", async (Request request, ApplicationDbContext db) =>
        {
            try
            {
                await db.Requests.AddAsync(request);
                await db.SaveChangesAsync();
                return Results.Created($"/api/requests/{request.RequestID}", request);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapPost("/api/comments", async (Comment comment, ApplicationDbContext db) =>
        {
            try
            {
                await db.Comments.AddAsync(comment);
                await db.SaveChangesAsync();
                return Results.Created($"/api/comments/{comment.CommentID}", comment);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // обновление
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
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapPut("/api/requests", async (Request requestData, ApplicationDbContext db) =>
        {
            try
            {
                var request = await db.Requests.FirstOrDefaultAsync(r => r.RequestID == requestData.RequestID);
                if (request == null) return Results.NotFound();
                request.CarType = requestData.CarType;
                request.CarModel = requestData.CarModel;
                request.ProblemDescryption = requestData.ProblemDescryption;
                request.RequestStatus = requestData.RequestStatus;
                request.CompletionDate = requestData.CompletionDate;
                request.RepairParts = requestData.RepairParts;
                request.MasterID = requestData.MasterID;
                await db.SaveChangesAsync();
                return Results.Ok(request);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
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
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // удаление
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
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
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
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
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
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // поиск (серверный)
        app.MapGet("/api/requests/search", async (ApplicationDbContext db, string? status, string? query) =>
        {
            try
            {
                var q = db.Requests.AsQueryable();
                if (!string.IsNullOrWhiteSpace(status))
                {
                    q = q.Where(r => r.RequestStatus == status);
                }
                if (!string.IsNullOrWhiteSpace(query))
                {
                    // поиск по типу, модели и описанию проблемы (Postgres ILIKE)
                    var pattern = $"%{query}%";
                    q = q.Where(r => EF.Functions.ILike(r.CarType, pattern)
                                  || EF.Functions.ILike(r.CarModel, pattern)
                                  || EF.Functions.ILike(r.ProblemDescryption, pattern));
                }
                var list = await q.ToListAsync();
                return Results.Ok(list);
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // авторизация
        app.MapPost("/api/login", async (HttpContext context, ApplicationDbContext db, Person person) =>
        {
            try
            {
                var user = await db.Users.FirstOrDefaultAsync(
                    u => u.Login == person.Login && u.Password == person.Password);
                if (user == null) return Results.Unauthorized();

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.Name, user.Login),
                    new Claim(ClaimTypes.Role, user.Type),
                    new Claim("userID", user.UserID.ToString())
                };
                var claimsIdentity = new ClaimsIdentity(
                    claims, CookieAuthenticationDefaults.AuthenticationScheme);
                await context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(claimsIdentity));

                return Results.Ok(new { user.UserID, user.Fio, user.Type });
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/api/logout", async (HttpContext context) =>
        {
            try
            {
                await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return Results.Redirect("/login");
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // клиент
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
            try
            {
                await ServePage(ctx, "html/login.html", false);
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/my-requests", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/my-requests.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/create-request", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/create-request.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/request-detail", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/request-detail.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/faq", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/faq.html", false);
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });
        app.MapGet("/contact", async (HttpContext ctx) =>
        {
            try
            {
                await ServePage(ctx, "html/contact.html", false);
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        // сотрудники
        app.MapGet("/requests", async (HttpContext ctx) =>
        {
            try
            {
                if (!ctx.User.Identity!.IsAuthenticated) { ctx.Response.Redirect("/login"); return Results.Empty; }
                await ServePage(ctx, "html/requests.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.MapGet("/request-card", async (HttpContext ctx) =>
        {
            try
            {
                if (!ctx.User.Identity!.IsAuthenticated) { ctx.Response.Redirect("/login"); return Results.Empty; }
                await ServePage(ctx, "html/request-card.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.MapGet("/assign", async (HttpContext ctx) =>
        {
            try
            {
                if (!ctx.User.IsInRole("manager") && !ctx.User.IsInRole("admin"))
                    return Results.Redirect("/login");
                await ServePage(ctx, "html/assign.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.MapGet("/statistics", async (HttpContext ctx) =>
        {
            try
            {
                if (!ctx.User.IsInRole("manager") && !ctx.User.IsInRole("admin"))
                    return Results.Redirect("/login");
                await ServePage(ctx, "html/statistics.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.MapGet("/staff", async (HttpContext ctx) =>
        {
            try
            {
                if (!ctx.User.IsInRole("admin"))
                    return Results.Redirect("/login");
                await ServePage(ctx, "html/staff.html");
                return Results.Empty;
            }
            catch
            {
                return Results.Problem(detail: "Внутренняя ошибка сервера", title: "Ошибка", statusCode: 500);
            }
        });

        app.Run();
    }
}

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
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }
    public DbSet<User> Users { get; set; }
    public DbSet<Request> Requests { get; set; }
    public DbSet<Comment> Comments { get; set; }
}
record class Person(string Login, string Password);
