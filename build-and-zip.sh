#args order: filename $BITBUCKET_BUILD_NUMBER

declare -a cartridge_list
declare -a build_list

folders=$(ls -d */)

for FOLDER in $folders
do
	cd ${FOLDER::-1} # ::-1 removes trailing slash
	
	if [ -f "package.json" ]; then
		build_list+=(${FOLDER::-1})
	fi
	
	if [ -d "cartridges" ]; then
		cartridge_list+=(${FOLDER}"cartridges")
	fi
	cd ..
done

for bl in "${build_list[@]}"; do
	cd $bl
	npm i
	npm run build
	cd ..
done

mkdir -p $1

for i in "${cartridge_list[@]}"; do
	cp -r $i/* $1
done

zip -r $1.zip $1
rm -r $1
