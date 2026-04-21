using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Turnos.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessionalDniAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Professionals",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Dni",
                table: "Professionals",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Professionals");

            migrationBuilder.DropColumn(
                name: "Dni",
                table: "Professionals");
        }
    }
}
