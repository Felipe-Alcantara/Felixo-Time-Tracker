from core.models import Category, Task, Tag

# Criar categorias de exemplo
trabalho = Category.objects.create(name="Trabalho")
programacao = Category.objects.create(name="Programação", parent=trabalho)
reunioes = Category.objects.create(name="Reuniões", parent=trabalho)

estudo = Category.objects.create(name="Estudo")
faculdade = Category.objects.create(name="Faculdade", parent=estudo)
autodidata = Category.objects.create(name="Autodidata", parent=estudo)

# Criar tags
Tag.objects.create(name="urgente", color="#EF4444")
Tag.objects.create(name="importante", color="#F59E0B")
Tag.objects.create(name="reunião", color="#3B82F6")
Tag.objects.create(name="desenvolvimento", color="#10B981")

# Criar tasks de exemplo
Task.objects.create(name="Desenvolver nova feature", category=programacao)
Task.objects.create(name="Code review", category=programacao)
Task.objects.create(name="Daily standup", category=reunioes)
Task.objects.create(name="Estudar Django", category=autodidata)

print("✅ Dados de exemplo criados!")
exit()