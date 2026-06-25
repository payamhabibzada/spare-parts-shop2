import { useState } from "react";
import { useApp, Category as CategoryType } from "../store/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, Trash2, Edit, Tags, Package } from "lucide-react";
import { toast } from "sonner";

export default function Categories() {
  const { categories, products, addCategory, updateCategory, deleteCategory, language } = useApp();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<CategoryType | null>(null);

  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setNameFa("");
    setNameEn("");
    setDescription("");
    setEditMode(false);
    setCurrentCategory(null);
  };

  const handleAdd = () => {
    if (!nameFa.trim() || !nameEn.trim()) {
      toast.error(language === "fa" ? "نام فارسی و انگلیسی الزامی است" : "Both names are required");
      return;
    }

    if (editMode && currentCategory) {
      updateCategory({
        ...currentCategory,
        name_fa: nameFa,
        name_en: nameEn,
        description,
      });
      toast.success(language === "fa" ? "دسته‌بندی بروزرسانی شد" : "Category updated");
    } else {
      addCategory({
        name_fa: nameFa,
        name_en: nameEn,
        description,
      });
      toast.success(language === "fa" ? "دسته‌بندی اضافه شد" : "Category added");
    }

    setOpen(false);
    resetForm();
  };

  const handleEdit = (cat: CategoryType) => {
    setCurrentCategory(cat);
    setNameFa(cat.name_fa);
    setNameEn(cat.name_en);
    setDescription(cat.description);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    // Check if any products use this category
    const productsInCategory = products.filter((p) => p.category === name);
    if (productsInCategory.length > 0) {
      toast.error(
        language === "fa"
          ? `نمی‌توان این دسته‌بندی را حذف کرد. ${productsInCategory.length} جنس در این دسته وجود دارد.`
          : `Cannot delete. ${productsInCategory.length} products use this category.`
      );
      return;
    }

    if (confirm(language === "fa" ? "آیا مطمئن هستید؟" : "Are you sure?")) {
      deleteCategory(id);
      toast.success(language === "fa" ? "دسته‌بندی حذف شد" : "Category deleted");
    }
  };

  const getCategoryProductCount = (categoryNameFa: string) => {
    return products.filter((p) => p.category === categoryNameFa).length;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-gray-900 text-xl mb-1 font-bold">
            {language === "fa" ? "مدیریت دسته‌بندی‌ها" : "Manage Categories"}
          </h2>
          <p className="text-gray-500 text-sm">
            {language === "fa" ? `مجموع ${categories.length} دسته‌بندی` : `Total ${categories.length} categories`}
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="w-4 h-4 ml-2" />
              {language === "fa" ? "افزودن دسته‌بندی" : "Add Category"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={language === "fa" ? "rtl" : "ltr"} aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {editMode
                  ? (language === "fa" ? "ویرایش دسته‌بندی" : "Edit Category")
                  : (language === "fa" ? "افزودن دسته‌بندی جدید" : "Add New Category")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{language === "fa" ? "نام فارسی *" : "Persian Name *"}</Label>
                <Input
                  value={nameFa}
                  onChange={(e) => setNameFa(e.target.value)}
                  placeholder={language === "fa" ? "مثلاً: برقی" : "e.g.: Electronics"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "نام انگلیسی *" : "English Name *"}</Label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={language === "fa" ? "مثلاً: Electronics" : "e.g.: Electronics"}
                />
              </div>
              <div>
                <Label>{language === "fa" ? "توضیحات" : "Description"}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={language === "fa" ? "توضیحات اضافی..." : "Additional description..."}
                  rows={3}
                />
              </div>
              <Button onClick={handleAdd} className="w-full">
                {editMode
                  ? (language === "fa" ? "بروزرسانی" : "Update")
                  : (language === "fa" ? "افزودن" : "Add")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Tags className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "کل دسته‌بندی‌ها" : "Total Categories"}</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "کل اجناس" : "Total Products"}</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-gray-500 text-sm">{language === "fa" ? "میانگین اجناس / دسته" : "Avg Products/Category"}</p>
              <p className="text-2xl font-bold">
                {categories.length > 0 ? Math.round(products.length / categories.length) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">{language === "fa" ? "نام فارسی" : "Persian Name"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "نام انگلیسی" : "English Name"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "توضیحات" : "Description"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "تعداد اجناس" : "Products"}</TableHead>
              <TableHead className="text-right">{language === "fa" ? "عملیات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  {language === "fa" ? "دسته‌بندی‌ای ثبت نشده است" : "No categories added"}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.category_id}>
                    <TableCell className="font-medium">{cat.name_fa}</TableCell>
                    <TableCell className="text-gray-600">{cat.name_en}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{cat.description || "-"}</TableCell>
                    <TableCell>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm font-medium">
                      {getCategoryProductCount(cat.name_fa)} {language === "fa" ? "جنس" : "items"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cat)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cat.category_id, cat.name_fa)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Categories Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const productCount = getCategoryProductCount(cat.name_fa);
          return (
            <div
              key={cat.category_id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Tags className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)} className="h-8 w-8 p-0">
                    <Edit className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(cat.category_id, cat.name_fa)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                  </Button>
                </div>
              </div>
              <h3 className="text-gray-800 mb-1 font-semibold">
                {language === "fa" ? cat.name_fa : cat.name_en}
              </h3>
              <p className="text-gray-500 text-xs mb-3 line-clamp-2">{cat.description || "-"}</p>
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">
                  {productCount} {language === "fa" ? "جنس" : "items"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
