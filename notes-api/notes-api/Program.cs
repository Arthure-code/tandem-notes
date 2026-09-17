using Microsoft.EntityFrameworkCore;
using NotesApi.Data;
using NotesApi.Interfaces;
using NotesApi.Services;

namespace NotesApi
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddRouting(options => options.LowercaseUrls = true);
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // SQL Server when a connection string is configured (the hosted
            // API), SQLite in a local file otherwise, so a clone runs as is.
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite("Data Source=notes.db"));
            }
            else
            {
                builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
            }

            builder.Services.AddScoped<INoteService, NoteService>();

            // Only the origins listed in configuration may call the API from
            // a browser: the origins of the Tauri app by default.
            var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            var app = builder.Build();

            using (var scope = app.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();
            }

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseCors();
            app.MapControllers();

            app.Run();
        }
    }
}
