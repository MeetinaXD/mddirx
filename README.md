## `mddirx` - 一个增强版的 `mddir`
Created By `JohnByrneRepo`, Forked by `MeetinaXD`

**⚠️ 版权声明**：这是另一个项目`mddir`的修改版本

🔗 作者原项目地址：[JohnByrneRepo/mddir](https://github.com/JohnByrneRepo/mddir)

### 特色功能
✨ 增加了`--exclude`选项，可以排除不需要的项目。

✨ 增加了`--include`选项，可以只选择需要的项目。

✨ 增加了`--dironly`选项，可只输出目录结构，不包含文件。

*`--exclude`以及`--include`均使用正则表达式，且不可同时使用。*

### 用法

``` shell
mddirx [-i] "<输入路径>" -o "<输出文件>" [--exclude | --include] "<欲包含或排除的文件(夹)正则表达式>" --dironly

# 如：排除所有css文件
mddirx ../src --exclude "\S*\.css"
# 如：只包含所有C文件
mddirx --include "\S*\.c"
```

**注意：**`-i`选项是可空的。即如上示例，可以直接指定一个目录作为输入目录。

### 致谢

💓 感谢原作者`JohnByrneRepo`

🔪 以及向我提需求的`Tenma`